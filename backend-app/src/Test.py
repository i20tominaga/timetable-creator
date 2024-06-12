import json

def print_teacher_schedule_to_file(input_file, output_file):
    # JSONファイルを読み込む
    with open(input_file, 'r', encoding='utf-8') as file:
        schedule_data = json.load(file)

    # 出力ファイルにスケジュールを書き込む
    with open(output_file, 'w', encoding='utf-8') as file:
        previous_class = None  # 前のクラスを保持する変数
        for day in schedule_data['Days']:
            file.write(f'{day["Day"]}\n')
            for entry in day['Classes']:
                subject = entry['Subject']
                target = entry['Targets']
                if previous_class is not None and target != previous_class["Targets"]:  # クラスが変わったら空行を挿入
                    file.write('\n')  # 前のクラスがある場合にのみ空行を挿入
                file.write(f'{subject} ({target})\n')
                previous_class = entry  # 前のクラスを更新
            file.write('\n')  # 日付ごとに空行を挿入
            file.write('\n')
            file.write('\n')


# 使用例
input_file = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData/Export.json'
output_file = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData/Text.txt'
print_teacher_schedule_to_file(input_file, output_file)
