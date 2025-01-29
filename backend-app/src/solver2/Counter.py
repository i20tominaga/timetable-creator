import json

# JSONファイルの要素をカウントする関数
def count_elements(data):
    if isinstance(data, dict):
        return sum(count_elements(value) for value in data.values())
    elif isinstance(data, list):
        return sum(count_elements(item) for item in data)
    else:
        return 1

# メイン処理
def main():
    file_path = input("JSONファイルのパスを入力してください: ")

    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)

        # 要素のカウント
        total_elements = count_elements(data)
        print(f"JSONファイルの要素の合計: {total_elements}")
    except FileNotFoundError:
        print("指定されたファイルが見つかりませんでした。パスを確認してください。")
    except json.JSONDecodeError:
        print("ファイルの形式が正しいJSONではありません。")

# スクリプトの実行
if __name__ == "__main__":
    main()
