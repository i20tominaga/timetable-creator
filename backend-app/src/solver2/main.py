import json
import logging

from ResultExporter import format_constraints_to_json, save_to_file
from initial_solution_generator import generate_initial_solution
from maxsat_optimizer import optimize_schedule_with_maxsat

def main():
    courses_path = "../../../Data/First_Courses.json"
    instructors_path = "../../../SampleData/Instructors.json"
    rooms_path = "../../../Data/Rooms.json"
    output_path = "../../../Data/Schedule.json"

    logging.basicConfig(
        filename='scheduler.log',
        level=logging.DEBUG,
        format='%(asctime)s %(levelname)s:%(message)s'
    )

    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    periods_per_day = 4

    # データの読み込み
    try:
        with open(courses_path, "r", encoding="utf-8") as file:
            courses_data = json.load(file)
        with open(instructors_path, "r", encoding="utf-8") as file:
            instructors_data = json.load(file)
        with open(rooms_path, "r", encoding="utf-8") as file:
            rooms_data = json.load(file)
    except Exception as e:
        print(f"[ERROR] データの読み込みに失敗しました: {e}")
        return

    # --- 1) 初期解を生成 ---
    fulltime_courses = courses_data.get("Courses", [])
    instructors = instructors_data.get("Instructor", [])
    rooms = [room["name"] for room in rooms_data.get("Room", [])]

    initial_solution = generate_initial_solution(
        fulltime_courses=fulltime_courses,
        rooms=rooms,
        days=days,
        periods_per_day=periods_per_day,
        instructors_data=instructors,
        rooms_data=rooms_data.get("Room", [])
    )

    logging.info("初期解の生成が完了しました。")

    # --- 2) 初期解をMaxSATソルバーに渡して最適解を探索 ---
    improved_solution = optimize_schedule_with_maxsat(
        initial_solution=initial_solution,
        days=days,
        periods_per_day=periods_per_day,
        rooms=rooms,
        instructors_data=instructors,
        # 必要に応じて他の情報 (courses_data など) を引数に
        courses_data=fulltime_courses
    )

    logging.info("MaxSATソルバーによる最適化が完了しました。")

    # --- 3) 結果をJSON形式に変換して保存 ---
    # improved_solution も initial_solution と同じような構造をしていると仮定
    formatted_solution = {
        day: {"Classes": classes} for day, classes in improved_solution.items()
    }

    formatted_schedule = format_constraints_to_json(formatted_solution)
    save_to_file(formatted_schedule, output_path)

    logging.info("改善されたスケジュールをJSON形式で出力しました。")

if __name__ == "__main__":
    main()
