import pandas as pd

def parse_log_to_table(log_file_path: str) -> pd.DataFrame:
    """
    ログファイルを解析し、各先生の授業回数を曜日ごとにまとめた表を作成します。

    Args:
        log_file_path (str): ログファイルのパス

    Returns:
        pd.DataFrame: 各先生の授業回数を曜日ごとに集計したデータフレーム
    """
    instructor_data = {}
    current_day = None

    # ログファイルを読み込み
    with open(log_file_path, 'r', encoding='utf-8') as file:
        for line in file:
            line = line.strip()

            # 曜日を取得
            if line.startswith("Day:"):
                current_day = line.split("Day:")[1].strip()
                if current_day not in instructor_data:
                    instructor_data[current_day] = {}

            # 各先生の授業数を取得
            elif "Instructor" in line and "class(es)" in line:
                try:
                    parts = line.split(":")
                    instructor_name = parts[0].split("Instructor")[1].strip()
                    class_count = int(parts[1].split("class(es)")[0].strip())
                    if current_day:
                        if instructor_name not in instructor_data[current_day]:
                            instructor_data[current_day][instructor_name] = 0
                        instructor_data[current_day][instructor_name] += class_count
                except (IndexError, ValueError) as e:
                    # フォーマットが不正な行をスキップ
                    print(f"Skipped invalid log line: {line}")

    # データを整形
    all_instructors = sorted(
        {instr for day_data in instructor_data.values() for instr in day_data.keys()}
    )
    days = sorted(instructor_data.keys())
    table_data = {day: [] for day in days}

    for day in days:
        for instructor in all_instructors:
            table_data[day].append(instructor_data[day].get(instructor, 0))

    # データフレームに変換
    df = pd.DataFrame(table_data, index=all_instructors)
    df.index.name = "Instructor"
    return df


# ログファイルのパス
log_file_path = 'schedule_optimization.log'

# ログを解析して表を作成
df = parse_log_to_table(log_file_path)

# データフレームを表示
print("Instructor Schedule Summary:")
print(df)

# 必要に応じてCSVとして保存
df.to_csv("instructor_schedule_summary.csv", index=True)
