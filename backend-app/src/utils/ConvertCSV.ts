import * as fs from 'fs';
import { createArrayCsvWriter } from 'csv-writer';
import * as timetableAPI from '../api/Timetable';

// CSVファイルのパス
const csvFilePath = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData/Test.csv';

interface Period {
    period: number;
    length: number;
}

interface Class {
    Targets: string[];
    periods: Period;
    Subject: string;
    Instructors: string[];
    Rooms: string[];
}

interface Day {
    Day: string;
    Classes: Class[];
}

interface Data {
    Days: Day[];
}

interface table {
    name: string;
    file: string;
}

interface ExportJson {
    TimeTables: table[];
}

export async function convert(name: string) {
    try {
        const timetables = await timetableAPI.loadList();

        // `name` と `f.name` を確認
        const file = timetables.TimeTables.find((f: table) => {
            return f.name === name;
        });
        if (!file) {
            console.error(`Timetable with name "${name}" not found`);
            process.exit(1);
        }
        const filePath = file.file;

        // JSONファイルの読み込み
        const rawData = fs.readFileSync(filePath, 'utf8');

        const data: Data = JSON.parse(rawData);

        // データが正しい形で読み込まれているかを確認
        if (!data.Days || !Array.isArray(data.Days)) {
            console.error('Invalid data format: data.Days is not an array');
            process.exit(1);
        }

        // 曜日IDを取得する関数
        function getDayId(day: string): number {
            const arr = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
            return arr.indexOf(day);
        }

        // ターゲットIDを取得する関数
        function getTargetId(target: string): number {
            const arr = ['ME', 'IE', 'CA'];
            const a = target.substring(0, 2);
            const b = Number.parseInt(target.substring(2)) - 1;
            return b * 3 + arr.indexOf(a);
        }

        // 時間割表の初期化
        let table: string[][] = [];
        const classes = ['ME1', 'IE1', 'CA1', 'ME2', 'IE2', 'CA2', 'ME3', 'IE3', 'CA3', 'ME4', 'IE4', 'CA4', 'ME5', 'IE5', 'CA5'];
        for (const cls of classes) {
            table.push([cls, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
            table.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
            table.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
        }

        // 時間割データの処理
        for (const day of data.Days) {
            const dayId = getDayId(day.Day);
            for (const cls of day.Classes) {
                const x = dayId * 4 + cls.periods.period + 1;  // 1列右にずらす

                for (const target of cls.Targets) {
                    const targetId = getTargetId(target);
                    const y = targetId * 3;

                    // Ensure the row exists
                    if (!table[y]) table[y] = [];
                    if (!table[y + 1]) table[y + 1] = [];
                    if (!table[y + 2]) table[y + 2] = [];

                    table[y][x] = cls.Subject;
                    table[y + 1][x] = cls.Rooms.join('・');
                    table[y + 2][x] = cls.Instructors.join(',');
                }
            }
        }

        // CSVライターの設定
        const csvWriter = createArrayCsvWriter({
            path: csvFilePath,
            header: ['時間割', 'Monday', '', '', '', 'Tuesday', '', '', '', 'Wednesday', '', '', '', 'Thursday', '', '', '', 'Friday', '', '', '']
        });

        // CSVデータの生成
        const csvData = table.map((row) => row);

        // CSVファイルに書き込み
        csvWriter.writeRecords(csvData).then(() => {
            console.log('CSV file written successfully');
        });

    } catch (error) {
        console.error('Error:', error);
    }
}
