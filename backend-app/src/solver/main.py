from Reader import read_and_map_variables
from Preprocessor import preprocess_data
from ResultExporter import export_fixed_classes_to_json, export_fixed_classes_summary_to_json
from pysat.formula import WCNF

# ファイルパス
courses_path = "../../../SampleData/Courses.json"
instructors_path = "../../../SampleData/Instructors.json"
rooms_path = "../../../Data/Rooms.json"
output_path = "../../../SampleData/result.json"  # 編集用
summary_output_path = "../../../SampleData/summary_result.json"  # 表示用
fixed_output_path = "../../../SampleData/fixed_result.json"  # 固定済み授業の出力先

# 修正後の関数インポート
from ConstraintsDefiner import process_classes_with_constraints

def main():
    print("=== データの読み込みと変数マッピング ===")
    variables, teacher_related_variables, courses, instructors, rooms = read_and_map_variables(
        courses_path, instructors_path, rooms_path
    )
    print(f"変数マッピングが完了しました。合計変数数: {len(variables)}")

    # 非常勤講師の授業を固定
    fixed_literals = preprocess_data(variables, courses, instructors)

    # 固定済み授業をJSONに出力（デバッグ用）
    export_fixed_classes_to_json(fixed_literals, variables, courses, fixed_output_path)

    print("\n=== 授業のスケジュール確認（制約テスト） ===")
    days = [1, 2, 3, 4, 5]  # 月〜金
    max_classes_per_day = 4  # 1日の最大授業数
    scheduled_classes = process_classes_with_constraints(variables, courses, days, max_classes_per_day)

    print(f"\n=== テスト結果 ===")
    print(f"スケジュールされた授業数: {len(scheduled_classes)}")
    if scheduled_classes:
        print("[INFO] 授業のスケジュールが正常に処理されました。")
        export_fixed_classes_to_json(scheduled_classes, variables, courses, output_path)
        export_fixed_classes_summary_to_json(scheduled_classes, variables, courses, summary_output_path)
        print(f"\nスケジュールが {output_path} に保存されました。")
    else:
        print("[WARNING] 授業のスケジュールが作成されませんでした。")

if __name__ == "__main__":
    main()
