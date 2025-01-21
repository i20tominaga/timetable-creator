from  pysat.formula import WCNF

def add_teacher_constraints(variables, courses, instructors, fixed_literals):
    """
    MaxSATの制約を生成し、授業を格納する順序を月曜日の1コマ目から格納していくように設定する。
    """
    wcnf = WCNF()
    max_periods_per_day = 4  # 1日最大コマ数

    # 1. 教師の重複回避制約と1日のコマ数制限
    for instructor in instructors:
        instructor_name = instructor["name"]
        for slot in range(1, 5):  # 各時間枠（1コマ目〜4コマ目）
            for day in range(1, 6):  # 月曜日〜金曜日
                daily_literals = []  # その教師の1日のすべての授業リテラル
                slot_literals = []  # その時間枠に可能な授業リテラル

                for course in courses:
                    if instructor_name in course["instructors"]:
                        for target in course["targets"]:
                            key = (course["name"], target, day, slot)

                            # === 上書きを防止する処理 ===
                            # 既にそのコマに授業が固定されている場合はスキップ
                            if key not in variables or variables[key] in fixed_literals:
                                continue

                            literal = variables[key]
                            slot_literals.append(literal)
                            daily_literals.append(literal)

                # 教師の重複回避制約（ペアワイズ制約） - ソフト制約
                for i in range(len(slot_literals)):
                    for j in range(i + 1, len(slot_literals)):
                        wcnf.append([-slot_literals[i], -slot_literals[j]], weight=5)

    # 2. 授業が必ず週に1回以上配置される制約
    for course in courses:
        weekly_clause = []  # その授業がどこかに配置されることを保証するリテラル
        for slot in range(1, 5):  # 各時間枠
            for day in range(1, 6):  # 月曜日〜金曜日
                key = (course["name"], course["targets"][0], day, slot)

                # === 上書きを防止する処理 ===
                if key not in variables or variables[key] in fixed_literals:
                    continue

                weekly_clause.append(variables[key])

        # 週に1回以上配置される制約をソフト制約に変更
        if weekly_clause:
            wcnf.append(weekly_clause, weight=10)  # ソフト制約

    return wcnf
