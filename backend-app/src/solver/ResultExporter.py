import json
from collections import defaultdict

def export_fixed_classes_to_json(fixed_literals, variables, courses, output_path):
    """
    固定済みの授業をJSON形式で出力する。
    クラスごとに分けて、教室はまとめて出力する。

    Args:
        fixed_literals (list): 固定された授業のリテラルリスト。
        variables (dict): 変数マッピング。
        courses (list): 授業データ。
        output_path (str): 出力するJSONファイルのパス。
    """
    schedule = {
        "id": "固定済み授業",
        "Days": []
    }

    day_mapping = {
        1: "Monday",
        2: "Tuesday",
        3: "Wednesday",
        4: "Thursday",
        5: "Friday"
    }

    daily_schedule = defaultdict(lambda: defaultdict(dict))

    course_instructors = {}
    for course in courses:
        for target in course["targets"]:
            course_instructors[(course["name"], target)] = course["instructors"]

    for lit in fixed_literals:
        for key, var in variables.items():
            if var == lit:
                day = key[2]
                period = key[3]
                subject = key[0]
                target = key[1]
                room = key[4]

                class_key = (subject, target)

                instructors = course_instructors.get((subject, target), [])

                if class_key not in daily_schedule[day][period]:
                    daily_schedule[day][period][class_key] = {
                        "Subject": subject,
                        "Instructors": instructors,
                        "Rooms": set(),
                        "Targets": [target],
                        "periods": {
                            "period": period,
                            "length": 1
                        }
                    }

                daily_schedule[day][period][class_key]["Rooms"].add(room)

    # JSON形式に変換
    for day, periods in daily_schedule.items():
        day_entry = {
            "Day": day_mapping[day],
            "Classes": []
        }
        for period, classes in periods.items():
            for cls in classes.values():
                cls["Rooms"] = list(cls["Rooms"])
                day_entry["Classes"].append(cls)
        schedule["Days"].append(day_entry)

    # === 曜日順にソート ===
    schedule["Days"].sort(key=lambda x: list(day_mapping.values()).index(x["Day"]))

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(schedule, f, ensure_ascii=False, indent=4)

    print(f"固定授業が {output_path} に保存されました。")

def export_fixed_classes_summary_to_json(fixed_literals, variables, courses, output_path):
    """
    固定済みの授業をJSON形式で出力する。
    クラスごとではなく、対象クラスをまとめて出力する。

    Args:
        fixed_literals (list): 固定された授業のリテラルリスト。
        variables (dict): 変数マッピング。
        courses (list): 授業データ。
        output_path (str): 出力するJSONファイルのパス。
    """
    schedule = {
        "id": "固定済み授業_サマリー",
        "Days": []
    }

    # 曜日ごとに授業をまとめる
    day_mapping = {
        1: "Monday",
        2: "Tuesday",
        3: "Wednesday",
        4: "Thursday",
        5: "Friday"
    }

    # 正しい曜日順で格納するための初期化
    daily_schedule = {day: defaultdict(dict) for day in day_mapping.keys()}

    # 各授業の担当教師を簡単に参照するための辞書を作成
    course_instructors = {}
    for course in courses:
        course_instructors[course["name"]] = course["instructors"]

    # 固定された授業をループ処理
    for lit in fixed_literals:
        for key, var in variables.items():
            if var == lit:
                day = key[2]
                period = key[3] - 1  # === ここでインデックスを0始まりに補正 ===
                subject = key[0]
                target = key[1]
                room = key[4]

                # === 存在しない曜日のエントリ作成を防止 ===
                if day not in daily_schedule:
                    print(f"不正な曜日データ: {day}, 授業: {subject}")
                    continue  # dayが不正ならスキップ

                # 担当教師を取得
                instructors = course_instructors.get(subject, [])

                # 曜日ごとに正しいデータ構造で格納
                if subject not in daily_schedule[day][period]:
                    daily_schedule[day][period][subject] = {
                        "Subject": subject,
                        "Instructors": instructors,
                        "Rooms": set(),
                        "Targets": set(),
                        "periods": {
                            "period": period,
                            "length": 1
                        }
                    }

                # 部屋と対象クラスを追加
                daily_schedule[day][period][subject]["Rooms"].add(room)
                daily_schedule[day][period][subject]["Targets"].add(target)

    # === 曜日ごとのエントリを全て作成（空でも順番を守る）===
    for day in sorted(day_mapping.keys()):
        day_entry = {
            "Day": day_mapping[day],
            "Classes": []
        }

        # 授業がある曜日の処理
        for period, classes in sorted(daily_schedule[day].items()):
            for cls in classes.values():
                cls["Rooms"] = list(cls["Rooms"])
                cls["Targets"] = list(cls["Targets"])
                day_entry["Classes"].append(cls)

        # スケジュールに追加
        schedule["Days"].append(day_entry)

    # JSONファイルに書き込み
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(schedule, f, ensure_ascii=False, indent=4)

    print(f"固定授業サマリーが {output_path} に保存されました。")
