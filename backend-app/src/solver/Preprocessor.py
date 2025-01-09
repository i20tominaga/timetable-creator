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

def _process_fixed_classes(
    variables, instructor_name, course, instructor_availability,
    daily_teacher_schedule, weekly_fixed_classes,
    teacher_period_schedule, fixed_literals
):
    for period in course["periods"]:
        day, slot = period["day"], period["period"]

        # === デバッグ: 現在処理中の授業情報 ===
        print(f"処理中: {course['name']} (対象: {course['targets']}, 担当: {instructor_name}) - {day}日目 {slot}限")

        # 教員の空き状況を確認
        if not any(p["day"] == day and p["period"] == slot for p in instructor_availability[instructor_name]):
            print(f"スキップ: {course['name']} - 理由: 教員の都合")
            continue

        # 複数のターゲットクラスをまとめて処理
        weekly_keys = [(course["name"], target) for target in course["targets"]]
        if any(key in weekly_fixed_classes for key in weekly_keys):
            print(f"スキップ: {course['name']} - 理由: 同じ授業が週に1回以上配置される制約に該当")
            continue

        if teacher_period_schedule[instructor_name][day][slot] >= 1:
            print(f"スキップ: {course['name']} - 理由: 同じ時間帯に別の授業が担当済み")
            continue

        if daily_teacher_schedule[instructor_name][day] >= 4:
            print(f"スキップ: {course['name']} (担当: {instructor_name}) - 理由: 1日のコマ数上限に達している")
            continue

        fixed = False
        for room in course["rooms"]:
            fixed_for_all_targets = True
            for target in course["targets"]:
                key = (course["name"], target, day, slot, room)
                if key in variables:
                    lit = variables[key]
                    fixed_literals.append(lit)
                    print(f"固定済み: {course['name']} - {target} - 教室: {room}")
                else:
                    fixed_for_all_targets = False
                    print(f"スキップ: {course['name']} - {target} - 教室: {room} - 理由: 変数が見つからない")

            if fixed_for_all_targets:
                fixed = True
                teacher_period_schedule[instructor_name][day][slot] += 1

        if fixed:
            weekly_fixed_classes.update(weekly_keys)
            daily_teacher_schedule[instructor_name][day] += 1

    # 必要に応じて日次スケジュールのみを表示
    print(f"日次スケジュール: {dict(daily_teacher_schedule)}")
