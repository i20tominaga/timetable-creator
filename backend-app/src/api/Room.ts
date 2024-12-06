import * as fs from 'fs';
import * as path from 'path';
import { RoomJson } from '../types/types';

const roomsFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/Data/Rooms.json';

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
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 60 + minutes;

    let period: number | null = null;
    if (currentTime >= 530 && currentTime <= 620) period = 1; // 8:50 ~ 10:20
    if (currentTime >= 630 && currentTime <= 720) period = 2; // 10:30 ~ 12:00
    if (currentTime >= 770 && currentTime <= 860) period = 3; // 12:50 ~ 14:20
    if (currentTime >= 870 && currentTime <= 960) period = 4; // 14:30 ~ 16:00

    return { day, period };
}

// 教室データを取得
function getRoomData(): RoomJson[] {
    const filePath = path.join(__dirname, 'rooms.json');
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')).Rooms;
}
