# ConstraintsDefiner.py

from itertools import combinations

def at_most_k_encoding(variables, k, var_offset=10000):
    """
    シーケンシャルカウンターエンコーディングを使用して、At-Most-K 制約をCNFにエンコードします。

    Args:
        variables (list): 変数IDのリスト
        k (int): 制約の上限
        var_offset (int): 新しい変数のIDのオフセット

    Returns:
        tuple: (CNF制約リスト, 新しい変数のID)
    """
    cnf = []
    n = len(variables)
    if n <= k:
        return cnf, var_offset

    # シーケンシャルカウンター用の補助変数
    s = [[0 for _ in range(k + 1)] for _ in range(n + 1)]
    for i in range(n + 1):
        for j in range(k + 1):
            s[i][j] = var_offset
            var_offset += 1

    # 初期条件
    cnf.append([s[0][0]])  # s[0][0] は真
    for j in range(1, k + 1):
        cnf.append([-s[0][j]])  # s[0][j] は偽

    # 制約を追加
    for i in range(1, n + 1):
        for j in range(0, k + 1):
            if j == 0:
                # s[i][0] <-> ~x_i AND s[i-1][0]
                cnf.append([-variables[i-1], s[i][0], s[i-1][0]])
                cnf.append([variables[i-1], -s[i][0]])
                cnf.append([-s[i-1][0], -s[i][0]])
            else:
                # s[i][j] <-> s[i-1][j] OR (x_i AND s[i-1][j-1])
                cnf.append([-variables[i-1], -s[i-1][j-1], s[i][j]])
                cnf.append([-s[i][j], s[i-1][j]])
                cnf.append([-s[i][j], variables[i-1], s[i-1][j-1]])

    # 最後に s[n][k] が偽であることを追加 (At-Most-K)
    cnf.append([-s[n][k]])

    return cnf, var_offset

def add_exactly_one_class_constraint(variables, var_offset=10000):
    """
    各授業の各セッションがちょうど一度だけスケジュールに割り当てられるようにする制約（Exactly-One 制約）

    Args:
        variables (dict): 定義された変数と対応するIDの辞書
        var_offset (int): 新しい変数IDの開始点

    Returns:
        tuple: (CNF制約リスト, 新しい変数のオフセット)
    """
    cnf = []
    # {(name, target, day, period): [var_ids]}
    sessions = {}

    for (name, target, day, period, room), var_id in variables.items():
        key = (name, target, day, period)
        if key not in sessions:
            sessions[key] = []
        sessions[key].append(var_id)

    for session_key, session_vars in sessions.items():
        # At-Least-One 制約
        cnf.append(session_vars.copy())

        # At-Most-One 制約をシーケンシャルカウンターエンコーディングで追加
        at_most_one_cnf, var_offset = at_most_k_encoding(session_vars, 1, var_offset)
        cnf.extend(at_most_one_cnf)

        name, target, day, period = session_key
        print(f"[DEBUG] Class '{name}' Target '{target}' Day {day} Period {period}: Added Exactly-One constraint with {len(session_vars)} variables.")

    return cnf, var_offset

def add_no_overlap_constraint(variables, var_offset=10000):
    """
    同じ曜日・コマ・教室で異なるクラスの授業が重複しないようにする制約（At-Most-One 制約のシーケンシャルカウンターエンコーディングを使用）

    Args:
        variables (dict): 定義された変数と対応するIDの辞書
        var_offset (int): 新しい変数IDの開始点

    Returns:
        tuple: (CNF制約リスト, 新しい変数のオフセット)
    """
    cnf = {}
    for (name, target, day, period, room), var_id in variables.items():
        slot_key = (day, period, room)
        if slot_key not in cnf:
            cnf[slot_key] = []
        cnf[slot_key].append(var_id)

    constraints = []
    for slot, slot_vars in cnf.items():
        if len(slot_vars) > 1:
            # At-Most-One 制約をシーケンシャルカウンターエンコーディングで追加
            k = 1
            slot_cnf, var_offset = at_most_k_encoding(slot_vars, k, var_offset)
            constraints.extend(slot_cnf)
            print(f"[DEBUG] Slot {slot}: Added At-Most-{k} constraint using sequential counter.")

    return constraints, var_offset

def add_daily_limit_constraint(variables, courses, max_classes_per_day=4, var_offset=10000):
    """
    1日に行える最大授業数の制約を追加（At-Most-K 制約を効率的にエンコード）

    Args:
        variables (dict): 定義された変数と対応するIDの辞書
        courses (list): 授業データのリスト
        max_classes_per_day (int): 1日の最大授業数
        var_offset (int): 新しい変数IDの開始点

    Returns:
        tuple: (CNF制約リスト, 新しい変数のオフセット)
    """
    cnf = []
    for day in range(1, 6):  # 月曜日～金曜日
        daily_vars = [
            var_id for (name, target, d, period, room), var_id in variables.items() if d == day
        ]

        print(f"[DEBUG] Day {day}: Number of variables: {len(daily_vars)}")

        if len(daily_vars) > max_classes_per_day:
            day_cnf, var_offset = at_most_k_encoding(daily_vars, max_classes_per_day, var_offset)
            cnf.extend(day_cnf)
            print(f"[DEBUG] Day {day}: Added At-Most-{max_classes_per_day} constraint using sequential counter.")

    return cnf, var_offset
