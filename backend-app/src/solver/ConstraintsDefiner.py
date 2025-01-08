from pysat.formula import WCNF

def add_teacher_constraints(variables, courses, instructors):
    """
    教師の重複回避制約を追加する。

    Args:
        variables (dict): 変数マッピング。
        courses (list): 授業データ。
        instructors (list): 教師データ。

    Returns:
        WCNF: 教師の重複回避制約を追加したCNF式。
    """
    # ハード制約用のWCNFインスタンス
    wcnf = WCNF()

    # 教師の重複回避制約の追加
    for instructor in instructors:
        instructor_name = instructor["name"]
        for day in range(1, 6):  # 平日（月〜金）
            for slot in range(1, 5):  # 各時間枠（1〜4）
                clause = []  # この時間帯で可能性のある授業のリスト
                for course in courses:
                    if instructor_name in course["instructors"]:
                        for target in course["targets"]:
                            for room in course["rooms"]:
                                key = (course["name"], target, day, slot, room)
                                if key in variables:
                                    clause.append(variables[key])

                # 重複を禁止するペアワイズ制約を追加
                for i in range(len(clause)):
                    for j in range(i + 1, len(clause)):
                        wcnf.append([-clause[i], -clause[j]])  # 重複禁止（ハード制約）

    return wcnf
