from typing import List, Dict
import logging
import random

# ログ設定
logging.basicConfig(
    filename='initial_solution.log',
    level=logging.DEBUG,
    format='%(asctime)s %(levelname)s:%(message)s'
)

def get_num_periods(length: int) -> int:
    """
    lengthから必要な連続期間数を取得します。
    length=2 => 1コマ
    length=4 => 2コマ連続
    """
    return length // 2

def generate_initial_solution(
    fulltime_courses: List[Dict],
    rooms: List[str],
    days: List[str],
    periods_per_day: int,
    instructors_data: List[Dict],
    rooms_data: List[Dict]
) -> Dict[str, List[Dict]]:
    """
    スケジューリングを行い、初期解を生成します。

    カテゴリ:
      - cat=0 => 非常勤&複数
      - cat=1 => 非常勤&単数
      - cat=2 => 常勤&複数
      - cat=3 => 常勤&単数

    cat=3の授業は、まずlength=4の授業を2コマ連続で割り当て、次にlength=2の授業を割り当てます。
    """

    # コースの順序をランダムにシャッフルする
    random.shuffle(fulltime_courses)

    # -----------------------------------------
    # 0) 初期設定
    # -----------------------------------------
    grade_groups = [
        "ME1","IE1","CA1",
        "ME2","IE2","CA2",
        "ME3","IE3","CA3",
        "ME4","IE4","CA4",
        "ME5","IE5","CA5"
    ]
    initial_solution = {day: [] for day in days}

    instructor_schedule = [[set() for _ in range(periods_per_day)] for _ in range(len(days))]
    room_schedule = [[set() for _ in range(periods_per_day)] for _ in range(len(days))]

    # コース重複管理 (name+sorted(targets))
    scheduled_courses = set()

    # -----------------------------------------
    # 1) 補助関数
    # -----------------------------------------
    def get_unique_course_key(course: Dict) -> str:
        tg_sorted = sorted(course.get("targets", []))
        return course["name"] + "_" + "_".join(tg_sorted)

    def is_unscheduled(course: Dict) -> bool:
        return get_unique_course_key(course) not in scheduled_courses

    def mark_scheduled(course: Dict):
        scheduled_courses.add(get_unique_course_key(course))

    # 教員がその (day_idx, period_idx) に対応可能か
    def is_instructor_available(instr_id: str, day_idx: int, period_idx: int) -> bool:
        instructor = next((i for i in instructors_data if i["id"] == instr_id), None)
        if not instructor:
            return False
        if instructor.get("isFullTime", False):
            return True
        else:
            return any(
                (p["day"] == day_idx+1 and p["period"] == period_idx+1)
                for p in instructor.get("periods", [])
            )

    # そのクラスが (day_idx,period_idx) に既に入っていないか
    def is_class_slot_free(day_idx: int, period_idx: int, target_class: str, num_periods: int = 1) -> bool:
        day_str = days[day_idx]
        for assigned in initial_solution[day_str]:
            assigned_period = assigned["periods"]["period"]  # 0-based
            assigned_length = assigned["periods"].get("length", 1)  # default 1 period
            assigned_num_periods = get_num_periods(assigned_length)

            for offset in range(num_periods):
                check_period = period_idx + offset
                if check_period >= periods_per_day:
                    return False  # 範囲外
                if assigned_length == 1:
                    if target_class in assigned["Targets"] and assigned_period == check_period:
                        return False
                elif assigned_length == 2:
                    if target_class in assigned["Targets"] and (assigned_period == check_period or assigned_period + 1 == check_period):
                        return False
        return True

    # -----------------------------------------
    # 2) カテゴリ判定
    # -----------------------------------------
    def get_teacher_category(course: Dict) -> int:
        """
        カテゴリを判定します。
        cat=0 => 非常勤&複数
        cat=1 => 非常勤&単数
        cat=2 => 常勤&複数
        cat=3 => 常勤&単数
        """
        is_parttime = any(
            not next((i for i in instructors_data if i["id"] == instr_id), {}).get("isFullTime", True)
            for instr_id in course.get("instructors", [])
        )
        num_targets = len(course.get("targets", []))
        category = 3  # デフォルト
        if is_parttime and num_targets > 1:
            category = 0
        elif is_parttime and num_targets <= 1:
            category = 1
        elif (not is_parttime) and num_targets > 1:
            category = 2
        else:
            category = 3
        return category

    def get_num_possible_slots(course: Dict) -> int:
        return len(course.get("periods", []))

    # -----------------------------------------
    # 3) カテゴリ0,1,2 の通常の割り当て
    # -----------------------------------------
    def fill_courses_for_cat_normal(cat_value: int, courses: List[Dict]):
        """
        指定カテゴリのコースを 'periods' が少ない順にソートして、一気に割り当てる。
        ここではlength=2（1コマ）の授業のみを対象とする。
        """
        cat_courses = [c for c in courses if get_teacher_category(c) == cat_value and get_num_periods(c.get("length", 2)) == 1]
        if not cat_courses:
            return
        # periodsの少ない順
        cat_courses_sorted = sorted(cat_courses, key=get_num_possible_slots)

        for course in cat_courses_sorted:
            assigned = False
            for day_idx in range(len(days)):
                for period_idx in range(periods_per_day):
                    for grade in grade_groups:
                        # 既に埋まっていればスキップ
                        if not is_class_slot_free(day_idx, period_idx, grade, num_periods=1):
                            continue
                        # まだ未割り当て & grade含む
                        if is_unscheduled(course) and (grade in course["targets"]):
                            if can_assign_length2(course, day_idx, period_idx, grade):
                                assign_course_length2(course, day_idx, period_idx)
                                assigned = True
                                break  # 割り当て成功で次のコースへ
                    if assigned:
                        break  # 割り当て成功で次のコースへ
                if assigned:
                    break  # 割り当て成功で次のコースへ

    # -----------------------------------------
    # 4) cat=3 (常勤&単数) の割り当てを length=4 と length=2 に分ける
    # -----------------------------------------
    def fill_length4_courses_for_cat3(courses: List[Dict]):
        """
        常勤&単数(cat=3) のコースで length=4 の授業をすべて割り当てる。
        各コマに対して length=2 として割り当てる。
        """
        cat3_courses = [c for c in courses if get_teacher_category(c) == 3 and get_num_periods(c.get("length", 2)) == 2]

        # 割り当て可能なスロットが少ない順、かつ教員数が多い順にソート
        # これにより、スロットが少なく教員数が多い授業が優先的に割り当てられます
        cat3_courses_sorted = sorted(
            cat3_courses,
            key=lambda course: (get_num_possible_slots(course), -len(course.get("instructors", [])))
        )

        for course in cat3_courses_sorted:
            assigned = False  # 割り当てフラグ
            for day_idx in range(len(days)):
                for period_idx in range(periods_per_day - 1):  # 2コマ連続なので -1
                    for grade in grade_groups:
                        if not is_class_slot_free(day_idx, period_idx, grade, num_periods=2):
                            # logging.debug(f"授業「{course['name']}」のスロット（{days[day_idx]}, {period_idx}）がクラス「{grade}」で使用中です。")
                            continue
                        if is_unscheduled(course) and (grade in course["targets"]):
                            if can_assign_length4(course, day_idx, period_idx, grade):
                                # 2コマ連続で割り当てる
                                assign_course_length2(course, day_idx, period_idx)      # 1コマ目
                                assign_course_length2(course, day_idx, period_idx + 1)  # 2コマ目
                                assigned = True
                                 #logging.debug(f"授業「{course['name']}」をスロット（{days[day_idx]}, {period_idx}）と（{days[day_idx]}, {period_idx + 1}）に割り当てました。")
                                break  # 割り当て成功でループ終了
                    if assigned:
                        break  # 割り当て成功で次のコースへ
                if assigned:
                    break  # 割り当て成功で次のコースへ

    def fill_length2_courses_for_cat3(courses: List[Dict]):
        """
        常勤&単数(cat=3) のコースで length=2 の授業を割り当てる。
        割り当て手順:
            1. 各コマ（1コマ目から最後のコマまで）ごとに
            2. 各曜日（例: 月曜日から金曜日）を順番に確認し、割り当て可能な授業を探す
        割り当ての優先順位:
            periodsのlengthが小さい順（開催できる時間が少ない授業から）
            かつ教員の数が多い順
        """
        # cat=3 かつ length=2 のコースを取得
        cat3_courses = [
            c for c in courses
            if get_teacher_category(c) == 3 and get_num_periods(c.get("length", 2)) == 1
        ]

        # periodsの少ない順、かつ教員数が多い順にソート
        length2_courses_sorted = sorted(
            cat3_courses,
            key=lambda course: (get_num_possible_slots(course), -len(course.get("instructors", [])))
        )

        # 各コマごとに割り当てを試みる（例: 1コマ目から4コマ目まで）
        for period in range(periods_per_day):
            for day_idx in range(len(days)):
                for course in length2_courses_sorted:
                    if not is_unscheduled(course):
                        continue  # 既に割り当て済みのコースはスキップ
                    for grade in grade_groups:
                        if grade not in course["targets"]:
                            continue  # 対象クラスでなければスキップ
                        if is_class_slot_free(day_idx, period, grade, num_periods=1):
                            if can_assign_length2(course, day_idx, period, grade):
                                assign_course_length2(course, day_idx, period)
                                #logging.debug(f"授業「{course['name']}」をスロット（{days[day_idx]}, {period}）に割り当てました。")
                                break  # このコースは割り当てられたので次のコースへ

    # -----------------------------------------
    # 5) 「卒業研究」コースの割り当て関数
    # -----------------------------------------
    def assign_graduation_courses(graduation_courses: List[Dict]):
        """
        「卒業研究」コースを後から割り当てる。
        各「卒業研究」コースは特定のターゲットクラス（ME5, IE5, CA5）に対して割り当てる。
        """
        for course in graduation_courses:
            assigned = False
            # 「卒業研究」コースは length=2 と仮定
            for day_idx in range(len(days)):
                for period_idx in range(periods_per_day):
                    for grade in grade_groups:
                        if grade not in course["targets"]:
                            continue  # 対象クラスでなければスキップ
                        if is_class_slot_free(day_idx, period_idx, grade, num_periods=1):
                            if can_assign_length2(course, day_idx, period_idx, grade):
                                assign_course_length2(course, day_idx, period_idx)
                                assigned = True
                                #logging.debug(f"卒業研究コース「{course['name']}」をスロット（{days[day_idx]}, {period_idx}）に割り当てました。")
                                break  # 割り当て成功で次のコースへ
                    if assigned:
                        break
                if assigned:
                    break
            if not assigned:
                logging.debug(f"卒業研究コース '{get_unique_course_key(course)}' を割り当てられませんでした。")

    # -----------------------------------------
    # 6) 割り当て可能かどうかの関数群
    # -----------------------------------------
    def can_assign_length2(course: Dict, day_idx: int, period_idx: int, grade: str) -> bool:
        num_periods = get_num_periods(course.get("length", 2))  # length=2の場合は1コマ

        # Check if the single period is valid
        valid_slots = {
            (p["day"], p["period"])
            for p in course.get("periods", [])
        }

        if (day_idx + 1, period_idx + 1) not in valid_slots:
            # logging.debug(f"授業「{course['name']}」のスロット（{days[day_idx]}, {period_idx}）が有効なスロットではありません。")
            return False

        # クラス競合
        for tgt in course["targets"]:
            if not is_class_slot_free(day_idx, period_idx, tgt, num_periods=num_periods):
                # logging.debug(f"授業「{course['name']}」のスロット（{days[day_idx]}, {period_idx}）がクラス「{tgt}」で使用中です。")
                return False

        # 教員競合
        for instr in course["instructors"]:
            if instr in instructor_schedule[day_idx][period_idx]:
                # logging.debug(f"授業「{course['name']}」の教員「{instr}」がスロット（{days[day_idx]}, {period_idx}）で使用中です。")
                return False
            if not is_instructor_available(instr, day_idx, period_idx):
                # logging.debug(f"授業「{course['name']}」の教員「{instr}」がスロット（{days[day_idx]}, {period_idx}）に対応不可です。")
                return False

        # 教室競合
        for r in course["rooms"]:
            if r in room_schedule[day_idx][period_idx]:
                # logging.debug(f"授業「{course['name']}」の教室「{r}」がスロット（{days[day_idx]}, {period_idx}）で使用中です。")
                return False

        return True

    def can_assign_length4(course: Dict, day_idx: int, period_idx: int, grade: str) -> bool:
        num_periods = get_num_periods(course.get("length", 2))  # length=4の場合は2コマ

        # Check if two consecutive periods are within the day's schedule
        if period_idx + num_periods > periods_per_day:
            logging.debug(f"授業「{course['name']}」のスロット（{days[day_idx]}, {period_idx}）から連続{num_periods}コマが範囲外です。")
            return False  # 範囲外

        valid_slots = {
            (p["day"], p["period"])
            for p in course.get("periods", [])
        }

        # Check all required periods are valid
        for offset in range(num_periods):
            current_period = period_idx + offset
            if (day_idx + 1, current_period + 1) not in valid_slots:
                # logging.debug(f"授業「{course['name']}」のスロット（{days[day_idx]}, {current_period}）が有効なスロットではありません。")
                return False

        # クラス競合
        for tgt in course["targets"]:
            if not is_class_slot_free(day_idx, period_idx, tgt, num_periods=num_periods):
                # logging.debug(f"授業「{course['name']}」のスロット（{days[day_idx]}, {period_idx}）がクラス「{tgt}」で使用中です。")
                return False

        # 教員競合
        for instr in course["instructors"]:
            for offset in range(num_periods):
                current_period = period_idx + offset
                if instr in instructor_schedule[day_idx][current_period]:
                    # logging.debug(f"授業「{course['name']}」の教員「{instr}」がスロット（{days[day_idx]}, {current_period}）で使用中です。")
                    return False
                if not is_instructor_available(instr, day_idx, current_period):
                    # logging.debug(f"授業「{course['name']}」の教員「{instr}」がスロット（{days[day_idx]}, {current_period}）に対応不可です。")
                    return False

        # 教室競合
        for r in course["rooms"]:
            for offset in range(num_periods):
                current_period = period_idx + offset
                if r in room_schedule[day_idx][current_period]:
                    # logging.debug(f"授業「{course['name']}」の教室「{r}」がスロット（{days[day_idx]}, {current_period}）で使用中です。")
                    return False

        return True

    # -----------------------------------------
    # 7) 割り当て処理関数群
    # -----------------------------------------
    def assign_course_length2(course: Dict, day_idx: int, period_idx: int):
        day_str = days[day_idx]
        num_periods = get_num_periods(course.get("length", 2))  # length=2の場合は1コマ

        # 教室占有
        for r in course["rooms"]:
            room_schedule[day_idx][period_idx].add(r)

        # 教員占有
        for instr in course["instructors"]:
            instructor_schedule[day_idx][period_idx].add(instr)

        # スケジュールに記録
        assignment = {
            "Subject": course["name"],
            "Instructors": course["instructors"],
            "Rooms": course["rooms"],
            "Targets": course["targets"],
            "periods": {"period": period_idx, "length": num_periods}  # length=1コマまたは2コマ
        }
        initial_solution[day_str].append(assignment)

        # コースをスケジュール済みとしてマーク
        mark_scheduled(course)

    # -----------------------------------------
    # 8) 「卒業研究」コースの割り当て関数
    # -----------------------------------------
    def assign_graduation_courses(graduation_courses: List[Dict]):
        """
        「卒業研究」コースを後から割り当てる。
        各「卒業研究」コースは特定のターゲットクラス（ME5, IE5, CA5）に対して割り当てる。
        """
        for course in graduation_courses:
            assigned = False
            # 「卒業研究」コースは length=2 と仮定
            for day_idx in range(len(days)):
                for period_idx in range(periods_per_day):
                    for grade in grade_groups:
                        if grade not in course["targets"]:
                            continue  # 対象クラスでなければスキップ
                        if is_class_slot_free(day_idx, period_idx, grade, num_periods=1):
                            if can_assign_length2(course, day_idx, period_idx, grade):
                                assign_course_length2(course, day_idx, period_idx)
                                assigned = True
                                #logging.debug(f"卒業研究コース「{course['name']}」をスロット（{days[day_idx]}, {period_idx}）に割り当てました。")
                                break  # 割り当て成功で次のコースへ
                    if assigned:
                        break
                if assigned:
                    break
            if not assigned:
                logging.debug(f"卒業研究コース '{get_unique_course_key(course)}' を割り当てられませんでした。")

    # -----------------------------------------
    # 9) フェーズ実行順の調整
    # -----------------------------------------
    # 「卒業研究」以外のコースを分離
    graduation_courses = [c for c in fulltime_courses if c["name"] == "卒業研究"]
    other_courses = [c for c in fulltime_courses if c["name"] != "卒業研究"]

    # 通常のコースでスケジューリング
    fill_courses_for_cat_normal(0, other_courses)  # cat=0 => 非常勤&複数
    fill_courses_for_cat_normal(1, other_courses)  # cat=1 => 非常勤&単数
    fill_courses_for_cat_normal(2, other_courses)  # cat=2 => 常勤&複数
    fill_length4_courses_for_cat3(other_courses)   # cat=3 => 常勤&単数 (length=4)
    fill_length2_courses_for_cat3(other_courses)   # cat=3 => 常勤&単数 (length=2)

    # 「卒業研究」コースを後から割り当て
    assign_graduation_courses(graduation_courses)

    # -----------------------------------------
    # 10) 未割り当てのコースのログ出力
    # -----------------------------------------
    def get_key(course: Dict) -> str:
        return course["name"] + "_" + "_".join(sorted(course.get("targets", [])))

    all_keys = {get_key(c) for c in fulltime_courses}
    unscheduled = all_keys - scheduled_courses
    if unscheduled:
        logging.debug("=== 以下のコースは割り当てられませんでした ===")
        for k in unscheduled:
            logging.debug(f"  - {k}")
    else:
        logging.debug("全てのコースを割り当てました。")

    return initial_solution
