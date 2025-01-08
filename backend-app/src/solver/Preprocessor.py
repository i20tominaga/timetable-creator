import json
from collections import defaultdict

def preprocess_data(variables, courses, instructors):
    fixed_literals = []
    daily_teacher_schedule = defaultdict(lambda: defaultdict(int))  # 先生ごとの1日の授業数
    weekly_fixed_classes = set()  # 週1回の授業を記録
    teacher_period_schedule = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))  # 先生の各時間帯の授業数

    instructor_availability = {
        inst["name"]: inst.get("periods", []) for inst in instructors
    }

    for instructor in instructors:
        instructor_name = instructor["name"]
        is_full_time = instructor.get("isFullTime", True)

        for course in courses:
            if not is_full_time and len(course["targets"]) > 1 and instructor_name in course["instructors"]:
                _process_fixed_classes(
                    variables, instructor_name, course,
                    instructor_availability, daily_teacher_schedule,
                    weekly_fixed_classes, teacher_period_schedule,  # ← ここを追加
                    fixed_literals
                )

        for course in courses:
            if not is_full_time and len(course["targets"]) == 1 and instructor_name in course["instructors"]:
                _process_fixed_classes(
                    variables, instructor_name, course,
                    instructor_availability, daily_teacher_schedule,
                    weekly_fixed_classes, teacher_period_schedule,  # ← ここを追加
                    fixed_literals
                )

    print(f"固定された授業数: {len(fixed_literals)}")
    return fixed_literals

def _process_fixed_classes(variables, instructor_name, course, instructor_availability, daily_teacher_schedule, weekly_fixed_classes, teacher_period_schedule, fixed_literals):
    for period in course["periods"]:
        day, slot = period["day"], period["period"]

        print(f"処理中: {course['name']} (担当: {instructor_name}) - {day}日目 {slot}限")
        print(f"{instructor_name} の空き時間: {instructor_availability[instructor_name]}")

        if not any(p["day"] == day and p["period"] == slot for p in instructor_availability[instructor_name]):
            print(f"スキップ: {course['name']} (担当: {instructor_name}) - {day}日目 {slot}限 - 理由: 教員の都合")
            continue

        for target in course["targets"]:
            weekly_key = (course["name"], target)

            # 週に1回以上配置されることを防ぐ
            if weekly_key in weekly_fixed_classes:
                print(f"スキップ: {course['name']} (対象: {target}) - 既に固定済み")
                continue

            # === 修正ポイント: 講師の重複授業チェック ===
            if teacher_period_schedule[instructor_name][day][slot] >= 1:
                print(f"スキップ: {course['name']} (対象: {target}) - {day}日目 {slot}限 - 理由: 講師の重複割り当て")
                continue

            if daily_teacher_schedule[instructor_name][day] >= 4:
                print(f"スキップ: {course['name']} (担当: {instructor_name}) - {day}日目 {slot}限 - 理由: 1日のコマ数上限")
                continue

            fixed = False
            for room in course["rooms"]:
                key = (course["name"], target, day, slot, room)
                if key in variables:
                    lit = variables[key]
                    fixed_literals.append(lit)
                    print(f"固定済み: {key} (担当: {instructor_name})")
                    fixed = True
                    # 講師のその時間帯の担当授業を記録
                    teacher_period_schedule[instructor_name][day][slot] += 1
                else:
                    print(f"変数が見つかりません: {key} (担当: {instructor_name})")

            if fixed:
                weekly_fixed_classes.add(weekly_key)
                daily_teacher_schedule[instructor_name][day] += 1
