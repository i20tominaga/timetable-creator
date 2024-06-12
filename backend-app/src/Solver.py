from ortools.sat.python import cp_model
import json

# 部屋データの読み込み
with open('/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/Data/Rooms.json') as f:
    rooms_data = json.load(f)

# 教員データの読み込み
with open('/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData/Instructors.json') as f:
    instructors_data = json.load(f)

# 授業データの読み込み
with open('/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/TestData/Test_Courses.json') as f:
    courses_data = json.load(f)

rooms = [room['name'] for room in rooms_data['Room']]
teachers = [instructor['name'] for instructor in instructors_data['Instructor']]

# 授業、教員、部屋、対象クラスの情報を取得
courses = courses_data['Courses']
days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

model = cp_model.CpModel()

# 変数定義
schedule = {}
for course in courses:
    course_name = course['name']
    for target_class in course.get('targets', []):
        for day in days:
            for room in course.get('rooms', []):
                var = model.NewBoolVar(f'{course_name}_{target_class}_{day}_{room}')
                schedule[(course_name, target_class, day, room)] = var

# 各コマに同じ教室で複数の授業が行われない制約
for day in days:
    for room in rooms:
        model.Add(
            sum(schedule[(course['name'], target_class, day, room)]
                for course in courses
                for target_class in course.get('targets', [])
                if room in course.get('rooms', [])) <= 1
        )

# ソルバーの設定と解の探索
solver = cp_model.CpSolver()
solver.parameters.max_time_in_seconds = 30.0  # 30秒の制限時間を設定

status = solver.Solve(model)

# 結果の表示
if status == cp_model.FEASIBLE or status == cp_model.OPTIMAL:
    for day in days:
        print(f'{day}:')
        for course in courses:
            for target_class in course.get('targets', []):
                for room in course.get('rooms', []):
                    if solver.Value(schedule[(course['name'], target_class, day, room)]) == 1:
                        teacher = next((t for t in course.get('instructors', [])), "No Teacher")
                        print(f'  Class: {target_class}, Course: {course["name"]}, Room: {room}, Instructor: {teacher}')
else:
    print("No solution found.")
