from Reader import read_and_map_variables
from ConstraintsDefiner import add_teacher_constraints
from Preprocessor import preprocess_data
from ResultExporter import export_fixed_classes_to_json, export_fixed_classes_summary_to_json
from pysat.examples.rc2 import RC2
from pysat.formula import WCNF

# ファイルパス
courses_path = "../../../SampleData/Courses.json"
instructors_path = "../../../SampleData/Instructors.json"
rooms_path = "../../../Data/Rooms.json"
output_path = "../../../SampleData/result.json"  # 編集用
summary_output_path = "../../../SampleData/summary_result.json"  # 表示用
fixed_output_path = "../../../SampleData/fixed_result.json"  # 固定済み授業の出力先

def main():
    print("=== データの読み込みと変数マッピング ===")
    variables, teacher_related_variables, courses, instructors, rooms = read_and_map_variables(
        courses_path, instructors_path, rooms_path
    )
    print(f"変数マッピングが完了しました。合計変数数: {len(variables)}")

    # 非常勤講師の授業を固定
    fixed_literals = preprocess_data(variables, courses, instructors)

    # 固定済み授業をJSONに出力（編集用：クラスごとに分ける）
    export_fixed_classes_to_json(fixed_literals, variables, courses, fixed_output_path)

    # 固定済み授業をJSONに出力（表示用：クラスをまとめる）
    export_fixed_classes_summary_to_json(fixed_literals, variables, courses, summary_output_path)

    print("\n=== 教師の重複回避制約の生成 ===")
    wcnf = add_teacher_constraints(variables, courses, instructors)

    # 固定された授業のリテラルをハード制約として追加
    for lit in fixed_literals:
        wcnf.hard.append([lit])

    print(f"ハード制約の総数: {len(wcnf.hard)}")

    print("\n=== MaxSATソルバーの実行 ===")
    with RC2(wcnf) as rc2:
        solution = rc2.compute()

    print("\n=== 解の結果 ===")
    if solution:
        print(f"満たされた変数の数: {sum(1 for lit in solution if lit > 0)}")

        # 編集用（クラスごとに分ける）JSONエクスポート
        export_fixed_classes_to_json(solution, variables, courses, output_path)

        # 表示用（クラスをまとめる）JSONエクスポート
        export_fixed_classes_summary_to_json(solution, variables, courses, summary_output_path)

        print(f"\nスケジュールが {output_path}（編集用）および {summary_output_path}（表示用）に保存されました。")
    else:
        print("解が見つかりませんでした。")

if __name__ == "__main__":
    main()
