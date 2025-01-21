# var_def.py

from pysat.formula import IDPool

def define_variables(courses, rooms, instructors, valid_assignments=None):
    """
    変数を定義する関数

    Args:
        courses (list): 授業データのリスト
        rooms (list): 使用可能な教室のリスト
        instructors (list): 教師データのリスト
        valid_assignments (dict, optional): 授業ごとの有効な割り当て

    Returns:
        dict: 定義された変数と対応するIDの辞書
        IDPool: IDPoolオブジェクト
    """
    pool = IDPool()
    variables = {}

    for course in courses:
        course_name = course["name"]
        course_instructors = course.get("instructors", [])
        course_targets = course.get("targets", ["default"])
        course_rooms = course.get("rooms", [])
        course_periods = course.get("periods", [])

        for target in course_targets:
            for period in course_periods:
                day = period["day"]
                period_num = period["period"]

                # インストラクターのステータスを確認
                instructors_fulltime = [
                    instr for instr in instructors
                    if instr.get("name") in course_instructors and instr.get("isFullTime", False)
                ]
                instructors_parttime = [
                    instr for instr in instructors
                    if instr.get("name") in course_instructors and not instr.get("isFullTime", False)
                ]

                # インストラクターが見つからない場合の処理
                if not instructors_fulltime and not instructors_parttime:
                    print(f"[WARNING] Course '{course_name}' has no valid instructors assigned.")
                    continue  # この授業の変数を生成しない

                # ターゲットの数に基づく割り当て
                if len(course_targets) > 1:
                    # 複数のターゲット → 非常勤の先生が担当
                    assigned_instructors = instructors_parttime if instructors_parttime else instructors_fulltime
                else:
                    # 1つのターゲット → 常勤の先生が担当
                    assigned_instructors = instructors_fulltime if instructors_fulltime else instructors_parttime

                # インストラクターのステータスに基づいて教室をフィルタリングするロジックを追加
                # 必要に応じて教室の選択を制限可能

                for room in course_rooms:
                    if valid_assignments:
                        # 有効な割り当てのフィルタリング
                        valid_days = valid_assignments.get(course_name, {}).get("rooms", {}).get(room, {}).get("days", [])
                        if day not in valid_days:
                            continue
                        # 追加の条件があればここに記述
                    var_key = (course_name, target, day, period_num, room)
                    variables[var_key] = pool.id(var_key)

    print(f"[DEBUG] Total variables defined: {len(variables)}")
    # 初期の変数内容を確認（必要に応じて）
    for var_key, var_id in list(variables.items())[:5]:
        print(f"[DEBUG] Variable {var_id}: {var_key}")

    return variables, pool
