import json

def read_and_map_variables(courses_path, instructors_path, rooms_path):
    """
    JSONデータを読み込み、変数をマッピングする。

    Args:
        courses_path (str): Courses.jsonのパス。
        instructors_path (str): Instructors.jsonのパス。
        rooms_path (str): Rooms.jsonのパス。

    Returns:
        dict: 変数マッピングの辞書。
        dict: 教師関連変数の辞書。
        list: 授業データ。
        list: 教師データ。
        list: 教室データ。
    """
    # JSONデータの読み込みとエラーハンドリング
    try:
        with open(courses_path, "r", encoding="utf-8") as f:
            courses_data = json.load(f)
        with open(instructors_path, "r", encoding="utf-8") as f:
            instructors_data = json.load(f)
        with open(rooms_path, "r", encoding="utf-8") as f:
            rooms_data = json.load(f)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON format: {e}")
    except FileNotFoundError as e:
        raise FileNotFoundError(f"File not found: {e}")

    # 各データの取得
    courses = courses_data.get("Courses", [])
    instructors = instructors_data.get("Instructor", [])
    rooms = rooms_data.get("Room", [])

    if not courses or not instructors or not rooms:
        raise ValueError("Provided JSON files must contain valid course, instructor, and room data.")

    # 変数マッピングの生成
    variables = {}
    counter = 1

    # 授業名と対象クラスごとの教師マッピングを作成
    course_instructor_map = {}
    for course in courses:
        for target in course["targets"]:
            course_instructor_map[(course["name"], target)] = course["instructors"]

    # 変数マッピング作成
    for course in courses:
        for target in course["targets"]:
            for period in course["periods"]:
                for room in course["rooms"]:
                    key = (course["name"], target, period["day"], period["period"], room)
                    variables[key] = counter
                    counter += 1

    # 教師関連変数の生成
    teacher_related_variables = {
        k: v for k, v in variables.items()
        if (k[0], k[1]) in course_instructor_map
    }

    return variables, teacher_related_variables, courses, instructors, rooms
