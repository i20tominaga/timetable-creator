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
    例:
      length=2  => 1コマ分
      length=4  => 2コマ連続
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
    従来のカテゴリ別ロジックで割り当てを行いつつ、
    その後に「曜日×コマでまだ入れられる授業があれば埋める」処理を追加。
    """

    # ----------------------------------------------------
    # 0) 初期設定
    # ----------------------------------------------------
    grade_groups = [
        "ME1","IE1","CA1",
        "ME2","IE2","CA2",
        "ME3","IE3","CA3",
        "ME4","IE4","CA4",
        "ME5","IE5","CA5"
    ]

    MAX_ATTEMPTS = 1000
    attempt = 0

    while attempt < MAX_ATTEMPTS:
        attempt += 1
        logging.debug(f"=== 試行回数 {attempt} ===")

        # 解（スケジュール）の初期化：各曜日ごとに空のリスト
        initial_solution = {day: [] for day in days}

        # 各スロット（曜日×period）での教員・教室の使用状況管理
        instructor_schedule = [[set() for _ in range(periods_per_day)] for _ in range(len(days))]
        room_schedule = [[set() for _ in range(periods_per_day)] for _ in range(len(days))]

        # コースの順序をランダムにシャッフル
        random.shuffle(fulltime_courses)

        # ----------------------------------------------------
        # 1) 補助関数群
        # ----------------------------------------------------
        def get_unique_course_key(course: Dict) -> str:
            tg_sorted = sorted(course.get("targets", []))
            return course["name"] + "_" + "_".join(tg_sorted)

        # frequency管理用の辞書を初期化
        course_assignment_count = {}
        course_assigned_days = {}

        for course in fulltime_courses:
            key = get_unique_course_key(course)
            # frequency が無ければデフォルト1
            freq = course.get("frequency", 1)
            course_assignment_count[key] = 0
            course_assigned_days[key] = set()

        def course_can_be_assigned(course: Dict, day_idx: int) -> bool:
            """
            指定した曜日(day_idx)において、まだそのコースを割り当て可能か判定
            => frequencyが未達 & 同じ曜日にまだアサインしていない
            """
            key = get_unique_course_key(course)
            freq = course.get("frequency", 1)
            return (course_assignment_count[key] < freq) and (day_idx not in course_assigned_days[key])

        def mark_scheduled(course: Dict, day_idx: int):
            key = get_unique_course_key(course)
            course_assignment_count[key] += 1
            course_assigned_days[key].add(day_idx)

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

        def is_class_slot_free(day_idx: int, period_idx: int, target_class: str, num_periods: int = 1) -> bool:
            day_str = days[day_idx]
            for assigned in initial_solution[day_str]:
                assigned_period = assigned["periods"]["period"]
                assigned_length = assigned["periods"].get("length", 1)
                for offset in range(num_periods):
                    check_p = period_idx + offset
                    if check_p >= periods_per_day:
                        return False
                    if target_class in assigned["Targets"]:
                        # 既存が1コマなら period==check_p
                        # 2コマなら period==check_p or period+1==check_p
                        if assigned_length == 1 and assigned_period == check_p:
                            return False
                        if assigned_length == 2 and (
                            assigned_period == check_p or assigned_period + 1 == check_p
                        ):
                            return False
            return True

        def get_teacher_category(course: Dict) -> int:
            """
            カテゴリ判定：
              - cat=0: 非常勤＆複数対象
              - cat=1: 非常勤＆単数対象
              - cat=2: 常勤＆複数対象
              - cat=3: 常勤＆単数対象
            """
            is_parttime = any(
                not next((i for i in instructors_data if i["id"] == instr_id), {}).get("isFullTime", True)
                for instr_id in course.get("instructors", [])
            )
            num_targets = len(course.get("targets", []))
            if is_parttime and num_targets > 1:
                return 0
            elif is_parttime and num_targets <= 1:
                return 1
            elif (not is_parttime) and num_targets > 1:
                return 2
            else:
                return 3

        def get_num_possible_slots(course: Dict) -> int:
            return len(course.get("periods", []))

        def can_assign_length2(course: Dict, day_idx: int, period_idx: int, target: str) -> bool:
            """
            length=2 (1コマ) を day_idx, period_idx に置けるか判定
            """
            num_periods = get_num_periods(course.get("length", 2))  # 通常1
            valid_slots = {(p["day"], p["period"]) for p in course.get("periods", [])}
            # コースが day_idx+1, period_idx+1 を許可しているか
            if (day_idx+1, period_idx+1) not in valid_slots:
                return False
            # frequency チェック
            if not course_can_be_assigned(course, day_idx):
                return False
            # クラス重複チェック
            for tgt in course["targets"]:
                if not is_class_slot_free(day_idx, period_idx, tgt, num_periods=num_periods):
                    return False
            # 教員重複 + 非常勤可否
            for instr in course["instructors"]:
                if instr in instructor_schedule[day_idx][period_idx]:
                    return False
                if not is_instructor_available(instr, day_idx, period_idx):
                    return False
            # 教室重複
            for r in course["rooms"]:
                if r in room_schedule[day_idx][period_idx]:
                    return False
            return True

        def can_assign_length4(course: Dict, day_idx: int, period_idx: int, target: str) -> bool:
            """
            length=4 (2コマ連続) を day_idx, period_idx ~ period_idx+1 に置けるか判定
            """
            num_periods = get_num_periods(course.get("length", 2))  # 通常2
            if period_idx + num_periods > periods_per_day:
                return False
            valid_slots = {(p["day"], p["period"]) for p in course.get("periods", [])}
            for offset in range(num_periods):
                check_p = period_idx + offset
                if (day_idx+1, check_p+1) not in valid_slots:
                    return False
            if not course_can_be_assigned(course, day_idx):
                return False
            # クラス
            for tgt in course["targets"]:
                if not is_class_slot_free(day_idx, period_idx, tgt, num_periods=num_periods):
                    return False
            # 教員
            for instr in course["instructors"]:
                for offset in range(num_periods):
                    p2 = period_idx + offset
                    if instr in instructor_schedule[day_idx][p2]:
                        return False
                    if not is_instructor_available(instr, day_idx, p2):
                        return False
            # 教室
            for r in course["rooms"]:
                for offset in range(num_periods):
                    p2 = period_idx + offset
                    if r in room_schedule[day_idx][p2]:
                        return False
            return True

        def assign_course_length2(course: Dict, day_idx: int, period_idx: int):
            """
            1コマまたは2コマ連続(呼び出し2回)のアサインに使う
            """
            day_str = days[day_idx]
            num_periods = get_num_periods(course.get("length", 2))
            # 教員・教室占有
            for r in course["rooms"]:
                room_schedule[day_idx][period_idx].add(r)
            for instr in course["instructors"]:
                instructor_schedule[day_idx][period_idx].add(instr)

            # スケジュールに追加
            assignment = {
                "Subject": course["name"],
                "Instructors": course["instructors"],
                "Rooms": course["rooms"],
                "Targets": course["targets"],
                "periods": {"period": period_idx, "length": num_periods}
            }
            initial_solution[day_str].append(assignment)
            # frequencyカウント
            mark_scheduled(course, day_idx)

        def unassign_course_length2(course: Dict, day_idx: int, period_idx: int):
            # （本サンプルでは使わない想定、元のまま）
            day_str = days[day_idx]
            num_periods = get_num_periods(course.get("length", 2))
            for r in course["rooms"]:
                room_schedule[day_idx][period_idx].remove(r)
            for instr in course["instructors"]:
                instructor_schedule[day_idx][period_idx].remove(instr)
            initial_solution[day_str] = [
                a for a in initial_solution[day_str]
                if not (a["Subject"] == course["name"]
                        and set(a["Instructors"]) == set(course["instructors"])
                        and a["periods"]["period"] == period_idx)
            ]
            key = get_unique_course_key(course)
            if course_assigned_days[key]:
                course_assignment_count[key] = max(0, course_assignment_count[key] - 1)
                if day_idx in course_assigned_days[key]:
                    course_assigned_days[key].remove(day_idx)

        # ----------------------------------------------------
        # 2) 従来のカテゴリ別の割り当て処理
        # ----------------------------------------------------
        def fill_courses_for_cat_normal(cat_value: int, courses: List[Dict]):
            """
            cat=0,1,2 のコースのうち、length=2(1コマ)を従来ルールで割り当て
            """
            cat_courses = [
                c for c in courses
                if get_teacher_category(c) == cat_value and get_num_periods(c.get("length", 2)) == 1
            ]
            if not cat_courses:
                return
            cat_courses_sorted = sorted(cat_courses, key=get_num_possible_slots)

            for course in cat_courses_sorted:
                assigned = False
                for day_idx in range(len(days)):
                    for period_idx in range(periods_per_day):
                        for grade in grade_groups:
                            if not is_class_slot_free(day_idx, period_idx, grade, num_periods=1):
                                continue
                            if course_can_be_assigned(course, day_idx) and (grade in course["targets"]):
                                if can_assign_length2(course, day_idx, period_idx, grade):
                                    assign_course_length2(course, day_idx, period_idx)
                                    assigned = True
                                    break
                        if assigned:
                            break
                    if assigned:
                        break

        def fill_length4_courses_for_cat3(courses: List[Dict]):
            """
            cat=3(常勤＆単数対象) で length=4(=2コマ連続) を従来ルールで割り当て
            """
            cat3_courses = [
                c for c in courses
                if get_teacher_category(c) == 3 and get_num_periods(c.get("length", 2)) == 2
            ]
            cat3_courses_sorted = sorted(
                cat3_courses,
                key=lambda course: (
                    get_num_possible_slots(course),
                    -len(course.get("instructors", [])),
                    -len(course.get("rooms", []))
                )
            )
            for course in cat3_courses_sorted:
                assigned = False
                for day_idx in range(len(days)):
                    for period_idx in range(periods_per_day - 1):
                        for grade in grade_groups:
                            if not is_class_slot_free(day_idx, period_idx, grade, num_periods=2):
                                continue
                            if course_can_be_assigned(course, day_idx) and (grade in course["targets"]):
                                if can_assign_length4(course, day_idx, period_idx, grade):
                                    assign_course_length2(course, day_idx, period_idx)
                                    assign_course_length2(course, day_idx, period_idx + 1)
                                    assigned = True
                                    break
                        if assigned:
                            break
                    if assigned:
                        break

        def fill_length2_courses_for_cat3(courses: List[Dict]):
            """
            常勤＆単数（cat=3）のコース (length=2=1コマ) を、
            1コマ目(period=0)～3コマ目(period=2) の各曜日に対して埋める。
            さらに「直接割り当てられない場合、既に割り当て済みの授業とスワップして再度割り当てを試す」簡易ロジックを追加。

            - day_idxとday_nameを厳密に紐づけし、ログ出力にズレが生じないようにする
            - 空きコマがあっても直に入るコースがない場合、他コマの既存授業を一旦 unassign → 入れたいコースを格納 → unassigned したコースをどこかに再度入れられないかを試す
            (実装はあくまでサンプルであり、本格的なローカルサーチではない)
            """

            # 1) cat=3 & length=2(=1コマ) のコースだけ
            cat3_courses = [
                c for c in courses
                if get_teacher_category(c) == 3 and get_num_periods(c.get("length", 2)) == 1
            ]
            # ソート(従来通り)
            length2_courses_sorted = sorted(
                cat3_courses,
                key=lambda course: (
                    get_num_possible_slots(course),
                    -len(course.get("instructors", []))
                )
            )

            # period=0..2 のみ
            for p in range(3):
                # (A) まず曜日順に埋める
                for day_idx, day_name in enumerate(days):
                    while True:
                        assigned_something = False

                        for course in length2_courses_sorted:
                            if not course_can_be_assigned(course, day_idx):
                                continue

                            # 全ターゲットクラスが空いているか
                            can_place = True
                            for grade in course["targets"]:
                                if not is_class_slot_free(day_idx, p, grade, num_periods=1):
                                    can_place = False
                                    break
                            if not can_place:
                                continue

                            # 教員・教室OKか
                            rep_target = next(iter(course["targets"]), None)
                            if rep_target and can_assign_length2(course, day_idx, p, rep_target):
                                assign_course_length2(course, day_idx, p)
                                assigned_something = True
                                logging.debug(f"[fill_len2_cat3] Assigned {course['name']} -> {day_name}, p={p}")
                                break

                        if not assigned_something:
                            break

                # (B) 金曜日(最後)まで行ったら 全曜日×全クラスを再チェック
                while True:
                    assigned_something_global = False

                    for day_idx, day_name in enumerate(days):
                        for grade in grade_groups:
                            # すでに埋まっているかチェック
                            assigned_current = False
                            for asn in initial_solution[day_name]:
                                sp = asn["periods"]["period"]
                                ln = asn["periods"]["length"]
                                covered = [sp + off for off in range(ln)]
                                if p in covered and (grade in asn["Targets"]):
                                    assigned_current = True
                                    break

                            if assigned_current:
                                continue  # 既に埋まってる

                            # --- ここで「空きコマ」発見 ---
                            logging.debug(f"[DEBUG] Found empty slot -> {day_name} p={p}, grade={grade}")

                            # (1) まず直接入れられるコースを探す
                            assigned_here = False
                            for course in length2_courses_sorted:
                                if not course_can_be_assigned(course, day_idx):
                                    continue
                                if grade not in course["targets"]:
                                    continue
                                # 全ターゲット空きチェック
                                can_place = True
                                for g in course["targets"]:
                                    if not is_class_slot_free(day_idx, p, g, num_periods=1):
                                        can_place = False
                                        break
                                if not can_place:
                                    continue

                                if can_assign_length2(course, day_idx, p, grade):
                                    assign_course_length2(course, day_idx, p)
                                    assigned_something_global = True
                                    assigned_here = True
                                    logging.debug(f"[fill_len2_cat3] Re-check assigned {course['name']} -> {day_name}, p={p}")
                                    break

                            if assigned_here:
                                # 次のクラスへ
                                continue

                            # (2) 直接入れられるコースが無い→スワップ試行してみる
                            #     例: 適当にどこかの割り当てを1つ外し→この空きに入れてみる
                            #     超簡易サンプル(本格的にはもっとしっかり選択ロジックが必要)
                            logging.debug(f"[DEBUG] No direct course for {day_name}, p={p}, grade={grade} -> Trying swap")

                            # ここでは "先頭のアサイン1件" を無理やり外して再度挑戦してみる という例
                            # 適当にループして、unassign可能なコマを見つける
                            swapped = False
                            for swap_day_name in days:
                                if swapped:
                                    break
                                for asn in initial_solution[swap_day_name]:
                                    # unassign してみる
                                    unassign_course_length2(
                                        {
                                            "name": asn["Subject"],
                                            "instructors": asn["Instructors"],
                                            "rooms": asn["Rooms"],
                                            "targets": asn["Targets"],
                                            "length": 2  # 1コマ
                                        },
                                        days.index(swap_day_name),
                                        asn["periods"]["period"]
                                    )
                                    logging.debug(f"[DEBUG] Unassigned {asn['Subject']} from {swap_day_name}, p={asn['periods']['period']}")

                                    # 再度(grade)コマを割り当て可能かを試す
                                    assigned_here2 = False
                                    for course in length2_courses_sorted:
                                        if not course_can_be_assigned(course, day_idx):
                                            continue
                                        if grade not in course["targets"]:
                                            continue
                                        can_place2 = True
                                        for g in course["targets"]:
                                            if not is_class_slot_free(day_idx, p, g, num_periods=1):
                                                can_place2 = False
                                                break
                                        if not can_place2:
                                            continue
                                        if can_assign_length2(course, day_idx, p, grade):
                                            assign_course_length2(course, day_idx, p)
                                            logging.debug(f"[SWAP] Assigned {course['name']} to fill empty {day_name} p={p}, grade={grade}")
                                            assigned_something_global = True
                                            assigned_here2 = True
                                            swapped = True
                                            break

                                    if not assigned_here2:
                                        # もし埋まらなかったら元に戻す
                                        assign_course_length2(
                                            {
                                                "name": asn["Subject"],
                                                "instructors": asn["Instructors"],
                                                "rooms": asn["Rooms"],
                                                "targets": asn["Targets"],
                                                "length": 2
                                            },
                                            days.index(swap_day_name),
                                            asn["periods"]["period"]
                                        )
                                        logging.debug(f"[SWAP] Failed to fill {day_name} p={p}, revert unassign {asn['Subject']}")
                                    if swapped:
                                        break

                            # swapを試してもダメなら仕方ないので空きのまま続行

                    if not assigned_something_global:
                        break  # 追加で入れられないなら終了

            logging.debug("[fill_length2_courses_for_cat3] Done filling period=0..2 (1～3コマ).")


        # 次のコマ p+1 へ
        # ----------------------------------------------------
        # 3) (A) カテゴリ別割り当て (従来ロジック)
        # ----------------------------------------------------
        graduation_courses = [c for c in fulltime_courses if c["name"] == "卒業研究"]
        other_courses = [c for c in fulltime_courses if c["name"] != "卒業研究"]

        # カテゴリごとに呼び出し
        fill_courses_for_cat_normal(0, other_courses)  # cat=0 => 非常勤＆複数対象
        fill_courses_for_cat_normal(2, other_courses)  # cat=2 => 常勤＆複数対象
        fill_courses_for_cat_normal(1, other_courses)  # cat=1 => 非常勤＆単数対象
        fill_length4_courses_for_cat3(other_courses)   # cat=3 => 常勤＆単数対象 (length=4)
        fill_length2_courses_for_cat3(other_courses)   # cat=3 => 常勤＆単数対象 (length=2)

        # 卒業研究は別途
        def assign_graduation_courses(graduation_courses: List[Dict]) -> bool:
            for course in graduation_courses:
                assigned = False
                for day_idx in range(len(days)):
                    for period_idx in range(periods_per_day):
                        for grade in grade_groups:
                            if grade not in course["targets"]:
                                continue
                            if get_num_periods(course.get("length", 2)) == 1:
                                if can_assign_length2(course, day_idx, period_idx, grade):
                                    assign_course_length2(course, day_idx, period_idx)
                                    assigned = True
                                    break
                            else:
                                # length=4
                                if (period_idx + 1 < periods_per_day):
                                    if can_assign_length4(course, day_idx, period_idx, grade):
                                        assign_course_length2(course, day_idx, period_idx)
                                        assign_course_length2(course, day_idx, period_idx+1)
                                        assigned = True
                                        break
                        if assigned:
                            break
                    if assigned:
                        break
                if not assigned:
                    logging.debug(f"卒業研究コース '{get_unique_course_key(course)}' の割り当てに失敗しました。")
                    return False
            return True

        assign_graduation_courses(graduation_courses)

        # ----------------------------------------------------
        # 3) (B) 追加：曜日×コマごとに「まだ埋められるコース」を徹底的に埋める
        # ----------------------------------------------------
        # 1～3コマ目 (period=0,1,2) だけでなく、4コマ目(period=3) 以降も同じ要領で埋めたい
        # ここでは periods_per_day 全部を対象
        for p in range(periods_per_day):
            for day_idx, day_str in enumerate(days):

                # 割り当てが成功するたびに繰り返す
                while True:
                    assigned_something = False

                    # 各クラスをチェック
                    for c in grade_groups:
                        # すでにこのクラス c が pコマ目に割り当て済みならスキップ
                        already = False
                        for asn in initial_solution[day_str]:
                            sp = asn["periods"]["period"]
                            ln = asn["periods"]["length"]
                            if p in [sp + off for off in range(ln)] and (c in asn["Targets"]):
                                already = True
                                break
                        if already:
                            continue

                        # ここで「まだfrequency回数が残っている全コース」を対象にトライ
                        found_course = False
                        for course in fulltime_courses:
                            # このクラス c をターゲットに含むか？
                            if c not in course["targets"]:
                                continue
                            length_val = course.get("length", 2)
                            # 1コマ or 2コマ？
                            if get_num_periods(length_val) == 1:
                                if can_assign_length2(course, day_idx, p, c):
                                    assign_course_length2(course, day_idx, p)
                                    found_course = True
                                    assigned_something = True
                                    break
                            else:
                                # length=4 => 2コマ連続
                                if (p+1 < periods_per_day) and can_assign_length4(course, day_idx, p, c):
                                    assign_course_length2(course, day_idx, p)
                                    assign_course_length2(course, day_idx, p+1)
                                    found_course = True
                                    assigned_something = True
                                    break
                        # 1つコースが入ったら次のクラスへ
                        # 入らなくても次のクラスへ

                    if not assigned_something:
                        # これ以上入れられないならブレイク
                        break

        # ----------------------------------------------------
        # 4) 未割り当てコースのチェック
        # ----------------------------------------------------
        unscheduled = set()
        for course in fulltime_courses:
            key = get_unique_course_key(course)
            freq = course.get("frequency", 1)
            if course_assignment_count[key] < freq:
                unscheduled.add(key)

        if not unscheduled:
            logging.debug(f"全てのコースの割り当てに成功しました。試行回数: {attempt}")
            return initial_solution
        else:
            logging.debug(f"未割り当てコースが存在します。試行回数: {attempt}")
            logging.debug(f"未割り当て: {unscheduled}")
            # 別のシャッフル順で再試行
            continue

    logging.debug(f"最大試行回数 ({MAX_ATTEMPTS}) に達しましたが、未割り当てのコースが存在します。")
    return initial_solution
