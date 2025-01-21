def process_classes_with_constraints(variables, courses, days, max_classes_per_day=4):
    """
    制約をif文で制御しながら授業をスケジュールするロジック。
    """
    #print("[DEBUG] Processing classes with constraints (verification mode).")
    daily_schedule = {day: 0 for day in days}  # 各日の授業数カウント
    weekly_scheduled_courses = set()           # 週1回の授業を記録

    scheduled_classes = []  # スケジュールされた変数リスト

    for course in courses:
        # 週1回制約を確認
        if course["name"] in weekly_scheduled_courses:
            #print(f"[DEBUG] Skipping course {course['name']} (already scheduled for the week).")
            continue

        for period in course["periods"]:
            day, slot = period["day"], period["period"]

            # 1日の授業数制限を確認
            if daily_schedule[day] >= max_classes_per_day:
                #print(f"[DEBUG] Skipping period for day {day}, slot {slot} (max classes per day reached).")
                continue

            # 授業の変数を取得
            scheduled = False
            for room in course["rooms"]:
                key = (course["name"], course["targets"][0], day, slot, room)
                if key in variables:
                    scheduled_classes.append(variables[key])
                    daily_schedule[day] += 1
                    weekly_scheduled_courses.add(course["name"])
                    scheduled = True
                    #print(f"[DEBUG] Scheduled course {course['name']} on day {day}, slot {slot}, room {room}.")
                    break

            if scheduled:
                break  # 次の授業に移動

    #print(f"[DEBUG] Total scheduled classes: {len(scheduled_classes)}.")
    return scheduled_classes  # 修正: スケジュールされた授業を返す
