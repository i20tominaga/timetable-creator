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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentDayAndPeriod = exports.writeRooms = exports.loadRooms = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const roomsFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/Data/Rooms.json';
//教室データを取得する関数
function loadRooms() {
    try {
        const data = fs.readFileSync(roomsFile, 'utf-8');
        const jsonData = JSON.parse(data);
        // Roomが存在すればそのまま返す
        return Promise.resolve({ Room: jsonData.Room || jsonData.Rooms || [] });
    }
    catch (error) {
        console.error('Error loading rooms data:', error);
        return Promise.resolve({ Room: [] }); // エラーが発生した場合は空配列を返す
    }
}
exports.loadRooms = loadRooms;
// 教室データを書き込む関数
function writeRooms(data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(roomsFile, JSON.stringify(data, null, 2), 'utf8', (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
exports.writeRooms = writeRooms;
// 現在の曜日と時限を取得する関数
function getCurrentDayAndPeriod() {
    const now = new Date();
    const day = now.getDay(); // 日曜日は0, 土曜日は6
    const currentTime = now.getHours() * 60 + now.getMinutes(); // 現在時刻を分単位で表現
    // 時限の時間範囲 (開始時間と終了時間を分単位で表現)
    const periods = [
        { start: 530, end: 620 }, // 1限: 8:50 ~ 10:20
        { start: 630, end: 720 }, // 2限: 10:30 ~ 12:00
        { start: 770, end: 860 }, // 3限: 12:50 ~ 14:20
        { start: 870, end: 960 }, // 4限: 14:30 ~ 16:00
    ];
    // 現在の時刻がどの時限に該当するか判定
    const period = periods.findIndex(({ start, end }) => currentTime >= start && currentTime <= end);
    console.log(`day: ${day}, period: ${period}`);
    // 該当しない場合はnull、該当する場合はそのインデックスを返す
    return { day, period: period >= 0 ? period : null };
}
exports.getCurrentDayAndPeriod = getCurrentDayAndPeriod;
// 教室データを取得
function getRoomData() {
    const filePath = path.join(__dirname, 'rooms.json');
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')).Rooms;
}
