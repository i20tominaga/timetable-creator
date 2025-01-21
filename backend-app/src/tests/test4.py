from pysat.formula import IDPool
from pysat.examples.rc2 import RC2

# データ準備
courses = [
    {"name": "電磁気学", "instructors": ["片山"], "rooms": ["ME4"], "periods": [(1, 1), (1, 2)]}
]
instructors = [{"id": "片山", "name": "片山", "periods": [(1, 1), (1, 2)]}]
rooms = ["ME4"]

# 変数管理
pool = IDPool()
variables = {
    (c["name"], d, p, r): pool.id((c["name"], d, p, r))
    for c in courses for d, p in c["periods"] for r in c["rooms"]
}

# 制約生成
cnf = []

# 授業は1つのスロットにのみ割り当て
for course in courses:
    course_vars = [variables[(course["name"], d, p, r)] for d, p in course["periods"] for r in course["rooms"]]
    cnf.append(course_vars)  # 少なくとも1つ
    for i in range(len(course_vars)):
        for j in range(i + 1, len(course_vars)):
            cnf.append([-course_vars[i], -course_vars[j]])  # 同時割り当て禁止

# 教師のスケジュール制約
for inst in instructors:
    for course in courses:
        if inst["id"] in course["instructors"]:
            for d, p in course["periods"]:
                if (d, p) not in inst["periods"]:
                    for r in course["rooms"]:
                        cnf.append([-variables[(course["name"], d, p, r)]])

# 教室の使用制約
for d, p in [(1, 1), (1, 2)]:
    for r in rooms:
        course_vars = [variables[(c["name"], d, p, r)] for c in courses if (d, p) in c["periods"]]
        for i in range(len(course_vars)):
            for j in range(i + 1, len(course_vars)):
                cnf.append([-course_vars[i], -course_vars[j]])

# MaxSATソルバーで解を求める
solver = RC2(cnf)
solution = solver.compute()

# 結果の解析
if solution:
    schedule = []
    for var in solution:
        if var > 0:
            schedule.append(pool.obj(var))
    print("時間割:", schedule)
else:
    print("解が見つかりませんでした。")
