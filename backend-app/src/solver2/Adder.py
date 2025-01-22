import json

# JSONファイルパス
file_path = "../../../Data/First_Courses.json"  # ファイル名を適宜変更してください

# JSONファイルを読み込み、`length`を追加
def add_length_property(file_path):
    # ファイルを読み込む
    with open(file_path, "r", encoding="utf-8") as file:
        data = json.load(file)

    # 各授業に length プロパティを追加
    for course in data["Courses"]:
        course["length"] = 2

    # 更新されたデータを同じファイルに書き戻す
    with open(file_path, "w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)

# 実行
add_length_property(file_path)
print(f"Updated JSON has been saved to {file_path}")
