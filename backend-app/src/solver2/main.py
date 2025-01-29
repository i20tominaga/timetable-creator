import json
import logging
import requests
import time
import os
import copy

from ResultExporter import format_constraints_to_json, save_to_file
from initial_solution_generator import generate_initial_solution
from maxsat_optimizer import optimize_schedule_with_reassignment, log_free_days_per_instructor

# 評価関数（違反率を計算する）
from Evaluation import evaluate_schedule_with_violation_rate

def main():
    # 各種パス設定
    courses_path = "../../../Data/First_Courses.json"
    instructors_path = "../../../SampleData/Instructors.json"
    rooms_path = "../../../Data/Rooms.json"
    maxsat_output_base_path = "../../..//Data/Schedule"   # ← 最適化後のスケジュール（後に番号を付与）
    export_directory = "../../../SampleData/"           # ← Exportファイルの保存ディレクトリ
    export_base_name = "Export"
    export_extension = ".json"

    # TypeScript APIのベースURL
    api_base_url = "http://localhost:3001/api/timetable/create"

    # ロギング設定
    logging.basicConfig(
        filename='scheduler.log',
        level=logging.DEBUG,
        format='%(asctime)s %(levelname)s:%(message)s'
    )

    # スケジューリングする曜日と1日のコマ数
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    periods_per_day = 4

    # --- 1) データの読み込み ---
    try:
        with open(courses_path, "r", encoding="utf-8") as file:
            courses_data = json.load(file)
        with open(instructors_path, "r", encoding="utf-8") as file:
            instructors_data = json.load(file)
        with open(rooms_path, "r", encoding="utf-8") as file:
            rooms_data = json.load(file)
    except Exception as e:
        print(f"[ERROR] データの読み込みに失敗しました: {e}")
        logging.error(f"データの読み込みに失敗しました: {e}")
        return

    # --- 2) Greedy版の初期評価準備 ---
    greedy_method_initial = f"{export_directory}{export_base_name}2{export_extension}"  # 初回のGreedyファイル
    try:
        with open(greedy_method_initial, "r", encoding="utf-8") as f:
            greedy_data_initial = json.load(f)
        greedy_eval_initial = evaluate_schedule_with_violation_rate(greedy_data_initial, instructors_data)
    except Exception as e:
        print(f"[ERROR] Greedy版スケジュールの初期評価に失敗: {e}")
        logging.error(f"Greedy版スケジュールの初期評価に失敗: {e}")
        greedy_eval_initial = None

    # --- 3) MaxSATソルバーによる最適化と評価を10回実行 ---
    logging.info("=== MaxSATソルバーによる最適化と評価の10回実行開始 ===")
    print("\n=== MaxSATソルバーによる最適化と評価 (10回) ===")

    maxsat_total_hard_violation = 0.0
    maxsat_total_soft_violation = 0.0
    maxsat_total_hard_constraints = {}
    maxsat_total_soft_constraints = {}
    maxsat_iterations = 10
    maxsat_total_time = 0.0
    maxsat_times = []


    for i in range(1, maxsat_iterations + 1):
        logging.info(f"=== MaxSAT イテレーション {i} 開始 ===")
        print(f"\n=== MaxSAT イテレーション {i} ===")

        try:
            maxsat_start_time = time.perf_counter()
            # 初期解の生成
            fulltime_courses = copy.deepcopy(courses_data.get("Courses", []))
            instructors = copy.deepcopy(instructors_data.get("Instructor", []))
            rooms = [room["name"] for room in rooms_data.get("Room", [])]

            initial_solution = generate_initial_solution(
                fulltime_courses=fulltime_courses,
                rooms=rooms,
                days=days,
                periods_per_day=periods_per_day,
                instructors_data=instructors,
                rooms_data=rooms_data.get("Room", [])
            )
            logging.info(f"イテレーション {i}: 初期解の生成が完了しました。")
            print("初期解の生成が完了しました。")

            # MaxSATソルバーによる最適化
            improved_solution = optimize_schedule_with_reassignment(
                initial_solution=initial_solution,
                days=days,
                periods_per_day=periods_per_day,
                rooms=rooms,
                instructors_data=instructors,
                courses_data=fulltime_courses
            )
            logging.info(f"イテレーション {i}: MaxSATソルバーによる最適化が完了しました。")
            print("MaxSATソルバーによる最適化が完了しました。")

            # 結果をJSON形式に変換して保存
            formatted_solution = {
                day: {"Classes": classes} for day, classes in improved_solution.items()
            }
            json_str = format_constraints_to_json(formatted_solution)
            maxsat_output_path = f"{maxsat_output_base_path}{i}{export_extension}"
            save_to_file(json_str, maxsat_output_path)
            logging.info(f"イテレーション {i}: 改善されたスケジュールをJSON形式で出力しました。ファイル: {maxsat_output_path}")
            print(f"改善されたスケジュールをJSON形式で出力しました。ファイル: {maxsat_output_path}")

            maxsat_end_time = time.perf_counter()
            iteration_time = maxsat_end_time - maxsat_start_time
            maxsat_total_time += iteration_time
            maxsat_times.append(iteration_time)  # 時間をリストに追加

            # 改善後スケジュールの評価
            with open(maxsat_output_path, "r", encoding="utf-8") as f:
                improved_data = json.load(f)
            improved_eval = evaluate_schedule_with_violation_rate(improved_data, instructors_data)

            print(f"=== イテレーション {i} の評価 ===")
            print(f"Hard Violation Rate : {improved_eval['hard_violation_rate']:.3f}")
            print(f"Soft Violation Rate : {improved_eval['soft_violation_rate']:.3f}")

            # 評価結果を累積
            maxsat_total_hard_violation += improved_eval['hard_violation_rate']
            maxsat_total_soft_violation += improved_eval['soft_violation_rate']

            for k, v in improved_eval.get("hard_constraint_rates", {}).items():
                if k not in maxsat_total_hard_constraints:
                    maxsat_total_hard_constraints[k] = 0.0
                maxsat_total_hard_constraints[k] += v

            for k, v in improved_eval.get("soft_constraint_rates", {}).items():
                if k not in maxsat_total_soft_constraints:
                    maxsat_total_soft_constraints[k] = 0.0
                maxsat_total_soft_constraints[k] += v

            logging.info(f"イテレーション {i}: 評価が完了しました。Hard Violation Rate: {improved_eval['hard_violation_rate']}, Soft Violation Rate: {improved_eval['soft_violation_rate']}")
        except Exception as e:
            print(f"[ERROR] イテレーション {i}: MaxSAT最適化または評価に失敗しました: {e}")
            logging.error(f"イテレーション {i}: MaxSAT最適化または評価に失敗しました: {e}")
            continue

        logging.info(f"イテレーション {i}: 処理完了。")
        time.sleep(1)  # APIサーバーに負荷をかけないための待機

    # --- 4) 貪欲法による時間割作成と評価の10回実行 ---
    logging.info("=== 貪欲法による時間割作成と評価の10回実行開始 ===")
    print("\n=== 貪欲法による時間割作成と評価 (10回) ===")

    greedy_total_hard_violation = 0.0
    greedy_total_soft_violation = 0.0
    greedy_total_hard_constraints = {}
    greedy_total_soft_constraints = {}
    greedy_iterations = 10
    greedy_total_time = 0.0
    greedy_times = []

    # エクスポートファイルの開始番号
    start_export_number = 2

    for i in range(1, greedy_iterations + 1):
        logging.info(f"=== 貪欲法イテレーション {i} 開始 ===")
        print(f"\n=== 貪欲法イテレーション {i} ===")

        unique_id = f"run{i}"
        export_number = start_export_number + i - 1
        export_filename = f"{export_base_name}{export_number}{export_extension}"
        export_path = os.path.join(export_directory, export_filename)

        # --- 4.1) TypeScript APIを呼び出して時間割を作成 ---
        try:
            greedy_start_time = time.perf_counter()
            url = f"{api_base_url}/{unique_id}"
            response = requests.post(url)
            response.raise_for_status()  # HTTPエラーがあれば例外を発生させる
            logging.info(f"イテレーション {i}: TypeScript API呼び出し成功。ID: {unique_id}")
        except requests.RequestException as e:
            print(f"[ERROR] イテレーション {i}: TypeScript APIの呼び出しに失敗: {e}")
            logging.error(f"イテレーション {i}: TypeScript APIの呼び出しに失敗: {e}")
            continue
        greedy_end_time = time.perf_counter()
        iteration_time = greedy_end_time - greedy_start_time
        greedy_total_time += iteration_time
        greedy_times.append(iteration_time)  # 時間をリストに追加

        # --- 4.2) エクスポートファイルが作成されるまで待機 ---
        max_wait_time = 30  # 最大待機時間（秒）
        wait_interval = 1    # 待機間隔（秒）
        elapsed_time = 0

        while not os.path.exists(export_path):
            if elapsed_time >= max_wait_time:
                print(f"[ERROR] イテレーション {i}: エクスポートファイルがタイムアウトしました。ファイルパス: {export_path}")
                logging.error(f"イテレーション {i}: エクスポートファイルがタイムアウトしました。ファイルパス: {export_path}")
                break
            time.sleep(wait_interval)
            elapsed_time += wait_interval

        if not os.path.exists(export_path):
            continue  # ファイルが存在しない場合、次のイテレーションへ

        # --- 4.3) エクスポートファイルの読み込み ---
        try:
            with open(export_path, "r", encoding="utf-8") as file:
                timetable_data = json.load(file)
            logging.info(f"イテレーション {i}: エクスポートファイルの読み込みに成功。ファイル: {export_filename}")
        except Exception as e:
            print(f"[ERROR] イテレーション {i}: エクスポートファイルの読み込みに失敗: {e}")
            logging.error(f"イテレーション {i}: エクスポートファイルの読み込みに失敗: {e}")
            continue

        # --- 4.4) 時間割の評価 ---
        try:
            evaluation = evaluate_schedule_with_violation_rate(timetable_data, instructors_data)

            print(f"=== イテレーション {i} の評価 ===")
            print(f"Hard Violation Rate : {evaluation['hard_violation_rate']:.3f}")
            print(f"Soft Violation Rate : {evaluation['soft_violation_rate']:.3f}")

            # 評価結果を累積
            greedy_total_hard_violation += evaluation['hard_violation_rate']
            greedy_total_soft_violation += evaluation['soft_violation_rate']

            for constraint, rate in evaluation.get("hard_constraint_rates", {}).items():
                if constraint not in greedy_total_hard_constraints:
                    greedy_total_hard_constraints[constraint] = 0.0
                greedy_total_hard_constraints[constraint] += rate

            for constraint, rate in evaluation.get("soft_constraint_rates", {}).items():
                if constraint not in greedy_total_soft_constraints:
                    greedy_total_soft_constraints[constraint] = 0.0
                greedy_total_soft_constraints[constraint] += rate

            logging.info(f"イテレーション {i}: 評価が完了しました。Hard Violation Rate: {evaluation['hard_violation_rate']}, Soft Violation Rate: {evaluation['soft_violation_rate']}")
        except Exception as e:
            print(f"[ERROR] イテレーション {i}: 時間割の評価に失敗: {e}")
            logging.error(f"イテレーション {i}: 時間割の評価に失敗: {e}")
            continue

        logging.info(f"イテレーション {i}: 処理完了。")
        time.sleep(1)  # APIサーバーに負荷をかけないための待機

    # --- 5) 平均評価結果の計算 ---
    # MaxSATは10回
    average_maxsat_hard_violation = maxsat_total_hard_violation / maxsat_iterations
    average_maxsat_soft_violation = maxsat_total_soft_violation / maxsat_iterations

    average_maxsat_hard_constraints = {k: v / maxsat_iterations for k, v in maxsat_total_hard_constraints.items()}
    average_maxsat_soft_constraints = {k: v / maxsat_iterations for k, v in maxsat_total_soft_constraints.items()}

    average_maxsat_time = maxsat_total_time / maxsat_iterations
    if maxsat_iterations > 0:
        average_maxsat_hard_violation = maxsat_total_hard_violation / maxsat_iterations
        average_maxsat_soft_violation = maxsat_total_soft_violation / maxsat_iterations
        average_maxsat_hard_constraints = {k: v / maxsat_iterations for k, v in maxsat_total_hard_constraints.items()}
        average_maxsat_soft_constraints = {k: v / maxsat_iterations for k, v in maxsat_total_soft_constraints.items()}
        average_maxsat_time = maxsat_total_time / maxsat_iterations
        min_maxsat_time = min(maxsat_times) if maxsat_times else 0.0
        max_maxsat_time = max(maxsat_times) if maxsat_times else 0.0
        midiam_maxsat_time = sum(maxsat_times) / len(maxsat_times) if maxsat_times else 0.0
    else:
        average_maxsat_hard_violation = average_maxsat_soft_violation = 0.0
        average_maxsat_hard_constraints = average_maxsat_soft_constraints = {}
        average_maxsat_time = min_maxsat_time = max_maxsat_time = midiam_maxsat_time = 0.0
    # 貪欲法は10回
    average_greedy_hard_violation = greedy_total_hard_violation / greedy_iterations
    average_greedy_soft_violation = greedy_total_soft_violation / greedy_iterations

    average_greedy_hard_constraints = {k: v / greedy_iterations for k, v in greedy_total_hard_constraints.items()}
    average_greedy_soft_constraints = {k: v / greedy_iterations for k, v in greedy_total_soft_constraints.items()}

    if greedy_iterations > 0:
        average_greedy_time = greedy_total_time / greedy_iterations
        min_greedy_time = min(greedy_times) if greedy_times else 0.0
        max_greedy_time = max(greedy_times) if greedy_times else 0.0
        midiam_greedy_time = sum(greedy_times) / len(greedy_times) if greedy_times else 0.0
    else:
        average_greedy_hard_violation = average_greedy_soft_violation = 0.0
        average_greedy_hard_constraints = average_greedy_soft_constraints = {}
        average_greedy_time = min_greedy_time = max_greedy_time =midiam_greedy_time = 0.0


    # --- 6) 平均評価結果の出力 ---
    print("\n=== 平均評価結果 ===")
    print("\n--- MaxSAT Optimized Schedule Average ---")
    print(f"平均 Hard Violation Rate : {average_maxsat_hard_violation:.3f}")
    print(f"平均 Soft Violation Rate : {average_maxsat_soft_violation:.3f}")
    print(f"平均 作成時間 : {average_maxsat_time:.3f} 秒")
    print(f"最短 作成時間 : {min_maxsat_time:.3f} 秒")
    print(f"最長 作成時間 : {max_maxsat_time:.3f} 秒")
    print(f"中央値 作成時間 : {midiam_maxsat_time:.3f} 秒")

    print("平均 Hard Constraints:")
    for k, v in average_maxsat_hard_constraints.items():
        print(f"  {k} = {v:.3f}")
    print("平均 Soft Constraints:")
    for k, v in average_maxsat_soft_constraints.items():
        print(f"  {k} = {v:.3f}")

    print("\n--- Greedy Schedules Average ---")
    print(f"平均 Hard Violation Rate : {average_greedy_hard_violation:.3f}")
    print(f"平均 Soft Violation Rate : {average_greedy_soft_violation:.3f}")
    print(f"平均 作成時間 : {average_greedy_time:.3f} 秒")
    print(f"最短 作成時間 : {min_greedy_time:.3f} 秒")
    print(f"最長 作成時間 : {max_greedy_time:.3f} 秒")
    print(f"中央値 作成時間 : {midiam_greedy_time:.3f} 秒")

    print("平均 Hard Constraints:")
    for k, v in average_greedy_hard_constraints.items():
        print(f"  {k} = {v:.3f}")
    print("平均 Soft Constraints:")
    for k, v in average_greedy_soft_constraints.items():
        print(f"  {k} = {v:.3f}")

    logging.info("=== 平均評価結果 ===")
    logging.info("\n--- MaxSAT Optimized Schedule Average ---")
    logging.info(f"平均 Hard Violation Rate : {average_maxsat_hard_violation:.3f}")
    logging.info(f"平均 Soft Violation Rate : {average_maxsat_soft_violation:.3f}")
    logging.info(f"平均 作成時間 : {average_maxsat_time:.3f} 秒")
    logging.info(f"最短 作成時間 : {min_maxsat_time:.3f} 秒")
    logging.info(f"最長 作成時間 : {max_maxsat_time:.3f} 秒")
    logging.info(f"中央値 作成時間 : {midiam_maxsat_time:.3f} 秒")

    for k, v in average_maxsat_hard_constraints.items():
        logging.info(f"平均 Hard Constraint {k} = {v:.3f}")
    for k, v in average_maxsat_soft_constraints.items():
        logging.info(f"平均 Soft Constraint {k} = {v:.3f}")

    logging.info("\n--- Greedy Schedules Average ---")
    logging.info(f"平均 Hard Violation Rate : {average_greedy_hard_violation:.3f}")
    logging.info(f"平均 Soft Violation Rate : {average_greedy_soft_violation:.3f}")
    logging.info(f"平均 作成時間 : {average_greedy_time:.3f} 秒")
    logging.info(f"最短 作成時間 : {min_greedy_time:.3f} 秒")
    logging.info(f"最長 作成時間 : {max_greedy_time:.3f} 秒")
    logging.info(f"中央値 作成時間 : {midiam_greedy_time:.3f} 秒")

    for k, v in average_greedy_hard_constraints.items():
        logging.info(f"平均 Hard Constraint {k} = {v:.3f}")
    for k, v in average_greedy_soft_constraints.items():
        logging.info(f"平均 Soft Constraint {k} = {v:.3f}")

    logging.info("全てのイテレーションが完了し、平均評価結果が出力されました。")

if __name__ == "__main__":
    main()
