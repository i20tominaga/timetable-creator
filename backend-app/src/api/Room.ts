import * as fs from 'fs';
import * as path from 'path';
import { RoomJson } from '../types/types';

const roomsFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/Data/Rooms.json';

//教室データを取得する関数
export function loadRooms(): Promise<RoomJson> {
    try {
        const data = fs.readFileSync(roomsFile, 'utf-8');
        const jsonData = JSON.parse(data);

        // Roomが存在すればそのまま返す
        return Promise.resolve({ Room: jsonData.Room || jsonData.Rooms || [] });
    } catch (error) {
        console.error('Error loading rooms data:', error);
        return Promise.resolve({ Room: [] });    // エラーが発生した場合は空配列を返す
    }
}

// 教室データを書き込む関数
export function writeRooms(data: RoomJson): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        fs.writeFile(roomsFile, JSON.stringify(data, null, 2), 'utf8', (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}


// 現在の曜日と時限を取得する関数
export function getCurrentDayAndPeriod(): { day: number; period: number | null } {
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
    const period = periods.findIndex(
        ({ start, end }) => currentTime >= start && currentTime <= end
    );

    console.log(`day: ${day}, period: ${period}`);

    // 該当しない場合はnull、該当する場合はそのインデックスを返す
    return { day, period: period >= 0 ? period : null };
}

// 教室データを取得
function getRoomData(): RoomJson[] {
    const filePath = path.join(__dirname, 'rooms.json');
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')).Rooms;
}
