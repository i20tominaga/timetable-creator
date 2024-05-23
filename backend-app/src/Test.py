def print_teacher_schedule_to_file(schedule_data, output_file):
    with open(output_file, 'w') as file:
        for entry in schedule_data['Classes']:
            instructors = ', '.join(entry['Instructors'])
            file.write(f"{instructors}  {entry['Periods']} {schedule_data['Day']}\n")

# テストデータ
timetable_data = {
    "Day": "Friday",
            "Classes": [
                {
                    "Subject": "体育",
                    "Instructors": [
                        "北",
                        "宇野",
                        "瀬尾"
                    ],
                    "Targets": [
                        "ME4",
                        "IE4",
                        "CA4"
                    ],
                    "Rooms": [
                        "グラウンド"
                    ],
                    "Periods": 1,
                    "Length": 2
                },
                {
                    "Subject": "材料力学II",
                    "Instructors": [
                        "福田"
                    ],
                    "Targets": [
                        "ME4"
                    ],
                    "Rooms": [
                        "ME4"
                    ],
                    "Periods": 3,
                    "Length": 2
                },
                {
                    "Subject": "材料学II",
                    "Instructors": [
                        "西村"
                    ],
                    "Targets": [
                        "ME4"
                    ],
                    "Rooms": [
                        "ME4"
                    ],
                    "Periods": 5,
                    "Length": 2
                },
                {
                    "Subject": "関数論",
                    "Instructors": [
                        "飛車"
                    ],
                    "Targets": [
                        "ME4"
                    ],
                    "Rooms": [
                        "CAD"
                    ],
                    "Periods": 7,
                    "Length": 2
                },
                {
                    "Subject": "ベクトル解析",
                    "Instructors": [
                        "杉村"
                    ],
                    "Targets": [
                        "IE4"
                    ],
                    "Rooms": [
                        "IE4"
                    ],
                    "Periods": 1,
                    "Length": 2
                },
                {
                    "Subject": "コンピュータシステム実験",
                    "Instructors": [
                        "新田",
                        "柳澤"
                    ],
                    "Targets": [
                        "IE4"
                    ],
                    "Rooms": [
                        "IE電算",
                        "2スタCW"
                    ],
                    "Periods": 3,
                    "Length": 2
                },
                {
                    "Subject": "情報理論",
                    "Instructors": [
                        "宮崎"
                    ],
                    "Targets": [
                        "IE4"
                    ],
                    "Rooms": [
                        "メディア"
                    ],
                    "Periods": 5,
                    "Length": 2
                },
                {
                    "Subject": "フーリエ・ラプラス変換",
                    "Instructors": [
                        "室谷"
                    ],
                    "Targets": [
                        "IE4"
                    ],
                    "Rooms": [
                        "IE4"
                    ],
                    "Periods": 7,
                    "Length": 2
                },
                {
                    "Subject": "工学デザインI",
                    "Instructors": [
                        "中川",
                        "桑嶋",
                        "荒木"
                    ],
                    "Targets": [
                        "CA4"
                    ],
                    "Rooms": [
                        "1パ",
                        "設計製作"
                    ],
                    "Periods": 1,
                    "Length": 2
                },
                {
                    "Subject": "建築施工法△",
                    "Instructors": [
                        "目山"
                    ],
                    "Targets": [
                        "CA4"
                    ],
                    "Rooms": [
                        "CA4"
                    ],
                    "Periods": 3,
                    "Length": 2
                },
                {
                    "Subject": "応用解析学概論△",
                    "Instructors": [
                        "山本"
                    ],
                    "Targets": [
                        "ME4",
                        "IE4",
                        "CA4"
                    ],
                    "Rooms": [
                        "演習室"
                    ],
                    "Periods": 5,
                    "Length": 2
                },
                {
                    "Subject": "水理学△",
                    "Instructors": [
                        "渡辺"
                    ],
                    "Targets": [
                        "CA4"
                    ],
                    "Rooms": [
                        "CA4"
                    ],
                    "Periods": 7,
                    "Length": 2
                },
                {
                    "Subject": "歴史学△",
                    "Instructors": [
                        "奥山"
                    ],
                    "Targets": [
                        "ME5",
                        "IE5",
                        "CA5"
                    ],
                    "Rooms": [
                        "メディア"
                    ],
                    "Periods": 1,
                    "Length": 2
                },
                {
                    "Subject": "ドイツ語△",
                    "Instructors": [
                        "新枝"
                    ],
                    "Targets": [
                        "ME5",
                        "IE5",
                        "CA5"
                    ],
                    "Rooms": [
                        "演習室"
                    ],
                    "Periods": 3,
                    "Length": 2
                },
                {
                    "Subject": "卒業研究",
                    "Instructors": [
                        "ME全員"
                    ],
                    "Targets": [
                        "ME5"
                    ],
                    "Rooms": [
                        "各研究室"
                    ],
                    "Periods": 5,
                    "Length": 2
                },
                {
                    "Subject": "計測工学",
                    "Instructors": [
                        "橋爪"
                    ],
                    "Targets": [
                        "ME5"
                    ],
                    "Rooms": [
                        "1スタCWE"
                    ],
                    "Periods": 7,
                    "Length": 2
                },
                {
                    "Subject": "電子情報通信システム実験",
                    "Instructors": [
                        "原田",
                        "浦上"
                    ],
                    "Targets": [
                        "IE5"
                    ],
                    "Rooms": [
                        "IE電算",
                        "IE実験",
                        "IEソフト]"
                    ],
                    "Periods": 1,
                    "Length": 2
                },
                {
                    "Subject": "オペレーティングシステムII",
                    "Instructors": [
                        "重村"
                    ],
                    "Targets": [
                        "IE5"
                    ],
                    "Rooms": [
                        "2スタE"
                    ],
                    "Periods": 3,
                    "Length": 2
                },
                {
                    "Subject": "総合英語演習II",
                    "Instructors": [
                        "カート"
                    ],
                    "Targets": [
                        "IE5"
                    ],
                    "Rooms": [
                        "2スタE"
                    ],
                    "Periods": 5,
                    "Length": 2
                },
                {
                    "Subject": "中国語△",
                    "Instructors": [
                        "徳永"
                    ],
                    "Targets": [
                        "ME5",
                        "IE5",
                        "CA5"
                    ],
                    "Rooms": [
                        "ICT"
                    ],
                    "Periods": 7,
                    "Length": 2
                },
                {
                    "Subject": "建築構造設計",
                    "Instructors": [
                        "山根"
                    ],
                    "Targets": [
                        "CA5"
                    ],
                    "Rooms": [
                        "共同研究室"
                    ],
                    "Periods": 1,
                    "Length": 2
                },
                {
                    "Subject": "鋼構造学II△",
                    "Instructors": [
                        "海田"
                    ],
                    "Targets": [
                        "CA5"
                    ],
                    "Rooms": [
                        "共同研究室"
                    ],
                    "Periods": 3,
                    "Length": 2
                },
                {
                    "Subject": "卒業研究",
                    "Instructors": [
                        "CA全員"
                    ],
                    "Targets": [
                        "CA5"
                    ],
                    "Rooms": [
                        "各研究室"
                    ],
                    "Periods": 5,
                    "Length": 2
                },
                {
                    "Subject": "線形代数",
                    "Instructors": [
                        "宇根"
                    ],
                    "Targets": [
                        "CA5"
                    ],
                    "Rooms": [
                        "共同研究室"
                    ],
                    "Periods": 7,
                    "Length": 2
                }
            ]
}

output_file_path = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData/Text.txt'  # 任意の出力ファイルパスを指定してください
print_teacher_schedule_to_file(timetable_data, output_file_path)
