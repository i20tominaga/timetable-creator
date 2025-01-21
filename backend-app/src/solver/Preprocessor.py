import json
from collections import defaultdict

def preprocess_data(variables, courses, instructors):
    fixed_literals = []
    daily_teacher_schedule = defaultdict(lambda: defaultdict(int))  # 先生ごとの1日の授業数
    weekly_fixed_classes = set()  # 週1回の授業を記録
    teacher_period_schedule = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))  # 先生の各時間帯の授業数

    # 教員の空き状況を準備
    if not isinstance(instructors, list):
        raise TypeError("Expected 'instructors' to be a list, but got type: {}".format(type(instructors)))

    instructor_availability = {
        inst["name"]: inst.get("periods", []) for inst in instructors if isinstance(inst, dict)
    }

    print("[DEBUG] Instructors data loaded:", instructors[:3])
    print("[DEBUG] Instructor availability map:", instructor_availability)

    for instructor in instructors:
        if not isinstance(instructor, dict):
            continue
        instructor_name = instructor["name"]
        is_full_time = instructor.get("isFullTime", True)

        for course in courses:
            if not is_full_time and len(course["targets"]) > 1 and instructor_name in course["instructors"]:
                _process_fixed_classes(
                    variables, instructor_name, course,
                    instructor_availability, daily_teacher_schedule,
                    weekly_fixed_classes, teacher_period_schedule,
                    fixed_literals
                )

    print(f"[DEBUG] Total variables: {len(variables)}")
    print(f"[DEBUG] Variables: {list(variables.keys())[:10]}")  # 変数の一部を確認

    return fixed_literals

def _process_fixed_classes(
    variables, instructor_name, course, instructor_availability,
    daily_teacher_schedule, weekly_fixed_classes,
    teacher_period_schedule, fixed_literals
):
    for period in course["periods"]:
        day = period["day"]
        slot = period["period"] - 1  # 修正: コマのインデックスを0～3に調整

        print(f"[DEBUG] Checking course '{course['name']}' for targets {course['targets']} on day {day}, slot {slot}.")

        for room in course["rooms"]:
            for target in course["targets"]:
                key = (course["name"], target, day, slot, room)
                if key in variables:
                    print(f"[DEBUG] Found variable for {course['name']} -> {key}")
                else:
                    print(f"[DEBUG] Missing variable for {course['name']} -> {key}")
