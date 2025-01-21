from typing import List, Dict
import logging

logging.basicConfig(
    filename='initial_solution.log',
    level=logging.DEBUG,
    format='%(asctime)s %(levelname)s:%(message)s'
)

def generate_initial_solution(
    fulltime_courses: List[Dict],
    rooms: List[str],
    days: List[str],
    periods_per_day: int,
    instructors_data: List[Dict],
    rooms_data: List[Dict]
) -> Dict[str, List[Dict]]:
    """
    4つのフェーズに分けてスケジューリング:
      (1) cat=0 (非常勤&複数)
      (2) cat=1 (非常勤&単数)
      (3) cat=2 (常勤&複数)
      (4) cat=3 (常勤&単数) → さらに periods=1..20 の順に段階割り当て

    同じ "name" でも targets が異なる場合は別コース扱い。
    すでに埋めたスロットは後フェーズで上書きしない。

    これにより:
      - cat=3 (常勤&単数) のうち periods=1 が必ず先に埋まる
      - 次に periods=2 のコース
      - ...
    """

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
    def is_class_slot_free(day_idx: int, period_idx: int, target_class: str) -> bool:
        day_str = days[day_idx]
        for assigned in initial_solution[day_str]:
            if assigned["periods"]["period"] == period_idx:
                if target_class in assigned["Targets"]:
                    return False
        return True

    # 割り当て可能かどうか
    def can_assign(course: Dict, day_idx: int, period_idx: int, grade: str) -> bool:
        valid_slots = {
            (int(p["day"]), int(p["period"]))
            for p in course.get("periods", [])
        }
        if (day_idx+1, period_idx+1) not in valid_slots:
            return False

        # クラス競合
        for tgt in course["targets"]:
            if not is_class_slot_free(day_idx, period_idx, tgt):
                return False

        # 教員競合
        busy_instructors = instructor_schedule[day_idx][period_idx]
        for instr in course["instructors"]:
            if instr in busy_instructors:
                return False
            if not is_instructor_available(instr, day_idx, period_idx):
                return False

        # 教室競合
        occupied_rooms = room_schedule[day_idx][period_idx]
        for r in course["rooms"]:
            if r in occupied_rooms:
                return False

        return True

    def assign_course_to_slot(course: Dict, day_idx: int, period_idx: int):
        day_str = days[day_idx]
        # 教室占有
        for r in course["rooms"]:
            room_schedule[day_idx][period_idx].add(r)
        # 教員占有
        for instr in course["instructors"]:
            instructor_schedule[day_idx][period_idx].add(instr)

        # スケジュールに記録
        initial_solution[day_str].append({
            "Subject": course["name"],
            "Instructors": course["instructors"],
            "Rooms": course["rooms"],
            "Targets": course["targets"],
            "periods": {"period": period_idx, "length": 1}
        })
        mark_scheduled(course)

    # -----------------------------------------
    # 2) カテゴリ判定
    # -----------------------------------------
    def get_teacher_category(course: Dict) -> int:
        """
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

    # -----------------------------------------
    # 3) まず cat=0,1,2 を通常の方法で割り当て
    # -----------------------------------------
    def fill_courses_for_cat_normal(cat_value: int):
        """
        指定カテゴリのコースを 'periods' が少ない順にソートして、一気に割り当てる
        """
        cat_courses = [c for c in fulltime_courses if get_teacher_category(c) == cat_value]
        # periodsの少ない順
        cat_courses_sorted = sorted(cat_courses, key=get_num_possible_slots)

        for period_idx in range(periods_per_day):
            for day_idx in range(len(days)):
                for grade in grade_groups:
                    # 既に埋まっていればスキップ
                    if not is_class_slot_free(day_idx, period_idx, grade):
                        continue
                    # まだ未割り当て & grade含む
                    unscheduled_for_grade = [
                        co for co in cat_courses_sorted
                        if is_unscheduled(co) and (grade in co["targets"])
                    ]
                    for course in unscheduled_for_grade:
                        if can_assign(course, day_idx, period_idx, grade):
                            assign_course_to_slot(course, day_idx, period_idx)
                            break

    # -----------------------------------------
    # 4) cat=3 (常勤&単数) は periods=1→2→…20 の順で段階的に割り当て
    # -----------------------------------------
    def fill_courses_for_cat_3():
        """
        常勤&単数(cat=3) のコースを、periods=1のコース → periods=2 → ... → periods=20
        の順に段階スケジューリング
        """
        cat3_courses = [c for c in fulltime_courses if get_teacher_category(c) == 3]

        # 1) periods=1 のコースだけを先に埋める => 次に periods=2 のコース => ...
        for length in range(1, 21):  # 1..20
            # このサブフェーズで扱うコース
            sublist = [co for co in cat3_courses if get_num_possible_slots(co) == length]

            # ここでも特にソート順を入れたいなら(例: さらに instructorsの数とか...)
            # いらないならサブフェーズ内は順序どおり
            # sublist_sorted = sorted(sublist, key=...)  # optional

            for period_idx in range(periods_per_day):
                for day_idx in range(len(days)):
                    for grade in grade_groups:
                        if not is_class_slot_free(day_idx, period_idx, grade):
                            continue
                        unscheduled_for_grade = [
                            co for co in sublist
                            if is_unscheduled(co) and (grade in co["targets"])
                        ]
                        for course in unscheduled_for_grade:
                            if can_assign(course, day_idx, period_idx, grade):
                                assign_course_to_slot(course, day_idx, period_idx)
                                break

    # -----------------------------------------
    # 5) フェーズ実行順
    # -----------------------------------------
    # (1) cat=0 => 非常勤&複数
    fill_courses_for_cat_normal(0)

    # (2) cat=1 => 非常勤&単数
    fill_courses_for_cat_normal(1)

    # (3) cat=2 => 常勤&複数
    fill_courses_for_cat_normal(2)

    # (4) cat=3 => 常勤&単数 (periods=1→2→...20)
    fill_courses_for_cat_3()

    # -----------------------------------------
    # 6) 未割り当て一覧ログ
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
