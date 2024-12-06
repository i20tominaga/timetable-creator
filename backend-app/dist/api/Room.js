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
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 60 + minutes;
    let period = null;
    if (currentTime >= 530 && currentTime <= 620)
        period = 1; // 8:50 ~ 10:20
    if (currentTime >= 630 && currentTime <= 720)
        period = 2; // 10:30 ~ 12:00
    if (currentTime >= 770 && currentTime <= 860)
        period = 3; // 12:50 ~ 14:20
    if (currentTime >= 870 && currentTime <= 960)
        period = 4; // 14:30 ~ 16:00
    return { day, period };
}
exports.getCurrentDayAndPeriod = getCurrentDayAndPeriod;
// 教室データを取得
function getRoomData() {
    const filePath = path.join(__dirname, 'rooms.json');
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')).Rooms;
}
