"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convert = void 0;
const fs = __importStar(require("fs"));
const csv_writer_1 = require("csv-writer");
const timetableAPI = __importStar(require("../api/Timetable"));
// CSVファイルのパス
const csvFilePath = '../../../SampleData/Test.csv';
function convert(name) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const timetables = yield timetableAPI.loadList();
            // `name` と `f.name` を確認
            const file = timetables.TimeTables.find((f) => {
                return f.name === name;
            });
            if (!file) {
                console.error(`Timetable with name "${name}" not found`);
                process.exit(1);
            }
            const filePath = file.file;
            // JSONファイルの読み込み
            const rawData = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(rawData);
            // データが正しい形で読み込まれているかを確認
            if (!data.Days || !Array.isArray(data.Days)) {
                console.error('Invalid data format: data.Days is not an array');
                process.exit(1);
            }
            // 曜日IDを取得する関数
            function getDayId(day) {
                const arr = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                return arr.indexOf(day);
            }
            // ターゲットIDを取得する関数
            function getTargetId(target) {
                const arr = ['ME', 'IE', 'CA'];
                const a = target.substring(0, 2);
                const b = Number.parseInt(target.substring(2)) - 1;
                return b * 3 + arr.indexOf(a);
            }
            // 時間割表の初期化
            let table = [];
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
                    const x = dayId * 4 + cls.periods.period + 1; // 1列右にずらす
                    for (const target of cls.Targets) {
                        const targetId = getTargetId(target);
                        const y = targetId * 3;
                        // Ensure the row exists
                        if (!table[y])
                            table[y] = [];
                        if (!table[y + 1])
                            table[y + 1] = [];
                        if (!table[y + 2])
                            table[y + 2] = [];
                        table[y][x] = cls.Subject;
                        table[y + 1][x] = cls.Rooms.join('・');
                        table[y + 2][x] = cls.Instructors.join(',');
                    }
                }
            }
            // CSVライターの設定
            const csvWriter = (0, csv_writer_1.createArrayCsvWriter)({
                path: csvFilePath,
                header: ['時間割', 'Monday', '', '', '', 'Tuesday', '', '', '', 'Wednesday', '', '', '', 'Thursday', '', '', '', 'Friday', '', '', '']
            });
            // CSVデータの生成
            const csvData = table.map((row) => row);
            // CSVファイルに書き込み
            csvWriter.writeRecords(csvData).then(() => {
                console.log('CSV file written successfully');
            });
        }
        catch (error) {
            console.error('Error:', error);
        }
    });
}
exports.convert = convert;
