import logging
import json
from typing import Dict, List, Any
from pysat.formula import WCNF
from pysat.examples.rc2 import RC2

logging.basicConfig(
    filename='schedule_optimization.log',
    filemode='w',
    level=logging.DEBUG,
    format='%(asctime)s %(levelname)s:%(message)s'
)

def log_free_days_per_instructor(solution: Dict[str, Any], instructors_data: List[Dict], days: List[str]):
    logging.debug("=== Instructors with 0 Free Days ===")
    instructor_free_days = {instr["id"]: 0 for instr in instructors_data}

    for instructor in instructors_data:
        instr_id = instructor["id"]
        free_days_count = 0
        for day in days:
            classes = solution.get(day, [])
            has_class = any(instr_id in class_info.get("Instructors", []) for class_info in classes)
            if not has_class:
                free_days_count += 1
        instructor_free_days[instr_id] = free_days_count

    instructors_with_no_free_days = {iid: fd for iid, fd in instructor_free_days.items() if fd == 0}
    if instructors_with_no_free_days:
        logging.debug("以下の教員は1週間に授業がない日がありません：")
        for instr_id, free_days in instructors_with_no_free_days.items():
            logging.debug(f"Instructor {instr_id} has {free_days} free days.")
    else:
        logging.debug("すべての教員に少なくとも1日の授業がない日があります。")

    logging.debug("===============================")
    return instructors_with_no_free_days

def find_conflicting_classes(
    class_info: Dict[str, Any],
    day: str,
    schedule: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    授業が競合している他の授業を探す。
    """
    conflicts = []
    for other_class in schedule:
        if class_info == other_class:
            continue

        # 同じ時限・教室・教員が重複していれば競合
        if (
            class_info["periods"]["period"] == other_class["periods"]["period"] and
            set(class_info["Instructors"]) & set(other_class["Instructors"]) and
            set(class_info["Rooms"]) & set(other_class["Rooms"])
        ):
            conflicts.append(other_class)
    return conflicts

def log_total_constraints(wcnf: WCNF):
    """
    ログファイルに総制約数を出力する関数。
    """
    num_hard = len(wcnf.hard)
    num_soft = len(wcnf.soft)
    total_constraints = num_hard + num_soft
    logging.info(f"総制約数: {total_constraints} (ハード制約: {num_hard}, ソフト制約: {num_soft})")

def optimize_schedule_with_reassignment(
    initial_solution: Dict[str, List[Dict[str, Any]]],
    days: List[str],
    periods_per_day: int,
    rooms: List[str],
    instructors_data: List[Dict[str, Any]],
    courses_data: List[Dict[str, Any]],
) -> Dict[str, List[Dict[str, Any]]]:
    """
    授業情報を基に、MaxSATソルバー(RC2)を用いて、スケジュール最適化を行います。

    各授業は、利用可能なスロット（day, period, room）に対して変数を生成し、
    ・「授業は必ずどこかのスロットに配置される」こと
    ・「教室や教員の重複が起こらない」こと
    といったハード制約を追加します。

    さらに、下記のハード制約を追加することで、
    各曜日の必須コマ（0-indexで period 0, 1, 2、すなわち1～3コマ目）には必ず授業が配置されるようにしています。

    入力は「授業データ（courses_data）」「教室データ（rooms）」「教師データ（instructors_data）」となります。
    """
    logging.info("再配置を含むスケジュール最適化を開始します。")

    # WCNF初期化
    wcnf = WCNF()
    var_map = {}
    var_to_class_info = {}
    var_counter = 1

    # 授業の開催可能時間・教室を基にモデル化
    for course in courses_data:
        subject = course["name"]
        instructors = course["instructors"]
        rooms_available = course["rooms"]
        periods = course["periods"]
        length = course["length"]

        for period in periods:
            day_idx = period["day"] - 1  # 0-indexed
            period_idx = period["period"] - 1  # 0-indexed

            for room in rooms_available:
                # 必要なコマ数を確保できる場合のみ変数を生成
                if period_idx + length <= periods_per_day:
                    var_map[(subject, day_idx, period_idx, room)] = var_counter
                    var_to_class_info[var_counter] = {
                        "Day": day_idx,
                        "StartPeriod": period_idx,
                        "Room": room,
                        "Length": length,
                        "Instructors": instructors,
                        "Subject": subject,
                    }
                    var_counter += 1

    # 制約1: 授業は必ず1つのスロットに配置される
    for course in courses_data:
        subject = course["name"]
        class_vars = [
            var
            for key, var in var_map.items()
            if key[0] == subject
        ]
        if not class_vars:
            logging.warning(f"授業 '{subject}' に割り当て可能なスロットがありません。")
            continue
        wcnf.append(class_vars)
        for i in range(len(class_vars)):
            for j in range(i + 1, len(class_vars)):
                wcnf.append([-class_vars[i], -class_vars[j]])

    # 制約2: 教室の競合を防ぐ
    for day_idx in range(len(days)):
        for period_idx in range(periods_per_day):
            for room in rooms:
                room_vars = [
                    var
                    for key, var in var_map.items()
                    if key[1] == day_idx and key[2] == period_idx and key[3] == room
                ]
                for i in range(len(room_vars)):
                    for j in range(i + 1, len(room_vars)):
                        wcnf.append([-room_vars[i], -room_vars[j]])

    # 制約3: 教員の競合を防ぐ
    for instructor in instructors_data:
        instr_id = instructor["id"]
        for day_idx in range(len(days)):
            for period_idx in range(periods_per_day):
                instructor_vars = [
                    var
                    for var, class_info in var_to_class_info.items()
                    if class_info["Day"] == day_idx
                    and class_info["StartPeriod"] <= period_idx < class_info["StartPeriod"] + class_info["Length"]
                    and instr_id in class_info["Instructors"]
                ]
                for i in range(len(instructor_vars)):
                    for j in range(i + 1, len(instructor_vars)):
                        wcnf.append([-instructor_vars[i], -instructor_vars[j]])

    # 追加の必須制約: 各曜日の1～3コマ目（0-indexedで period 0,1,2）は必ず授業が配置される
    for day_idx in range(len(days)):
        for target_period in range(3):  # period 0, 1, 2
            candidate_vars = [
                var
                for key, var in var_map.items()
                if key[1] == day_idx and key[2] <= target_period < key[2] + var_to_class_info[var]["Length"]
            ]
            if candidate_vars:
                # この曜日・コマには、候補のいずれかが採用されなければならない（ハード制約）
                wcnf.append(candidate_vars)
            else:
                logging.warning(f"Day {day_idx}のperiod {target_period}に配置可能な授業候補が存在しません。")

    # ソフト制約: 担当授業数が少ない教員を優先して休みにする（オプション）
    instructor_daily_load = {instr["id"]: [0] * len(days) for instr in instructors_data}
    for var, class_info in var_to_class_info.items():
        for instructor in class_info["Instructors"]:
            instructor_daily_load[instructor][class_info["Day"]] += 1
    for day_idx, day in enumerate(days):
        for instructor_id, daily_loads in instructor_daily_load.items():
            if daily_loads[day_idx] > 0:
                weight = 10000 / daily_loads[day_idx]
                daily_vars = [
                    var
                    for var, class_info in var_to_class_info.items()
                    if class_info["Day"] == day_idx and instructor_id in class_info["Instructors"]
                ]
                if daily_vars:
                    wcnf.append([-v for v in daily_vars], weight=weight)

    log_total_constraints(wcnf)

    # ソルバーの実行
    try:
        solver = RC2(wcnf)
        model = solver.compute()
    except Exception as e:
        logging.error(f"MaxSATソルバーの実行中にエラー: {e}")
        return initial_solution

    if model is None:
        logging.warning("解が見つかりませんでした。")
        return initial_solution

    # モデルから解を復元
    optimized_solution = {day: [] for day in days}
    for var in model:
        if var > 0 and var in var_to_class_info:
            class_info = var_to_class_info[var]
            day_index = class_info["Day"]
            if not isinstance(day_index, int):
                logging.error(f"Day index is not integer: {day_index} (type: {type(day_index)})")
                continue
            try:
                day_name = days[day_index]
            except IndexError:
                logging.error(f"Day index {day_index} is out of range for days list.")
                continue
            optimized_solution[day_name].append({
                "Subject": class_info["Subject"],
                "StartPeriod": class_info["StartPeriod"],
                "Room": class_info["Room"],
                "Instructors": class_info["Instructors"],
                "Length": class_info["Length"],
            })

    logging.info("再配置を含むスケジュール最適化が完了しました。")
    return optimized_solution

def main():
    courses_path = "../../../Data/First_Courses2023.json"
    instructors_path = "../../../SampleData/Instructors2023.json"
    rooms_path = "../../../Data/Rooms.json"
    initial_schedule_file = "../../../Data/initial_schedule.json"  # 初期スケジュールのファイルパス（使用しない場合は削除）
    maxsat_output_base_path = "../../../Data/Schedule"   # ← 最適化後のスケジュール（後に番号を付与）
    export_directory = "../../../SampleData/"           # ← Exportファイルの保存ディレクトリ
    export_base_name = "Export"
    export_extension = ".json"

    try:
        with open(courses_path, "r", encoding="utf-8") as file:
            courses_data = json.load(file)
        with open(instructors_path, "r", encoding="utf-8") as file:
            instructors_data = json.load(file)
        with open(rooms_path, "r", encoding="utf-8") as file:
            rooms_data = json.load(file)
    except Exception as e:
        print(f"[ERROR] データの読み込みに失敗しました: {e}")
        logging.error(f"データの読み込みに失敗しました: {e}")
        return
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    periods_per_day = 6

    # 初期スケジュールの読み込み（必要に応じて）
    initial_solution = {}
    if initial_schedule_file:
        try:
            with open(initial_schedule_file, "r", encoding="utf-8") as file:
                initial_solution = json.load(file)
        except Exception as e:
            print(f"[ERROR] 初期スケジュールの読み込みに失敗しました: {e}")
            logging.error(f"初期スケジュールの読み込みに失敗しました: {e}")

    # スケジュールの最適化
    optimized_schedule = optimize_schedule_with_reassignment(
        initial_solution,
        days,
        periods_per_day,
        rooms_data,
        instructors_data,
        courses_data
    )

    # 最適化されたスケジュールの保存
    output_path = f"{maxsat_output_base_path}_optimized.json"
    try:
        with open(output_path, "w", encoding="utf-8") as file:
            json.dump(optimized_schedule, file, ensure_ascii=False, indent=4)
        print(f"最適化されたスケジュールを保存しました: {output_path}")
        logging.info(f"最適化されたスケジュールを保存しました: {output_path}")
    except Exception as e:
        print(f"[ERROR] 最適化されたスケジュールの保存に失敗しました: {e}")
        logging.error(f"最適化されたスケジュールの保存に失敗しました: {e}")

if __name__ == "__main__":
    main()
    
