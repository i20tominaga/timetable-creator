"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
// JSONファイルからデータを読み込む関数
const readJsonFile = (filePath) => {
    const data = fs_1.default.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
};
// ファイルパスの設定
const coursesFilePath = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData/Courses.json';
const instructorsFilePath = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData/Instructors.json';
const roomsFilePath = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/Data/Rooms.json';
// JSONデータの読み込み
const coursesData = readJsonFile(coursesFilePath);
const instructors = readJsonFile(instructorsFilePath);
const rooms = readJsonFile(roomsFilePath);
// 読み込んだデータをログに出力
console.log('Courses:', coursesData.Courses);
console.log('Instructors:', instructors);
console.log('Rooms:', rooms);
// 部屋の空き状況をチェックする関数
const isRoomAvailable = (roomName, day, period) => {
    const room = rooms.find(r => r.name === roomName);
    if (!room || !room.unavailable)
        return true;
    return !room.unavailable.some(u => u.day === day && u.period === period);
};
// 授業を追加する関数
const addCourse = (course, schedule) => {
    const { day, period, instructor, room } = course;
    // 同じコマに同じ先生が授業を複数担当しない
    if (schedule[day][period].some(c => c.instructor === instructor)) {
        console.log(`Instructor ${instructor} is already teaching at day ${day}, period ${period}`);
        return false;
    }
    // 同じコマに同じ授業が複数ない
    if (schedule[day][period].some(c => c.name === course.name)) {
        console.log(`Course ${course.name} is already scheduled at day ${day}, period ${period}`);
        return false;
    }
    // 同じコマに同じ部屋を複数の授業が行われていない
    if (schedule[day][period].some(c => c.room === room)) {
        console.log(`Room ${room} is already occupied at day ${day}, period ${period}`);
        return false;
    }
    // 週間に同じ授業を複数回行わない
    for (let d = 0; d < schedule.length; d++) {
        if (schedule[d].some(p => p.some(c => c.name === course.name))) {
            console.log(`Course ${course.name} is already scheduled during the week.`);
            return false;
        }
    }
    // 授業を追加
    schedule[day][period].push(course);
    console.log(`Adding course ${course.name} at day ${day}, period ${period}`);
    return true;
};
// スケジュールを初期化
const days = 5; // 月曜から金曜
const periodsPerDay = 4; // 1日に最大4コマ
const schedule = Array.from({ length: days }, () => Array.from({ length: periodsPerDay }, () => []));
// 授業の追加を試みる
for (const course of coursesData.Courses) {
    const success = addCourse(course, schedule);
    if (!success) {
        console.log(`Skipping course ${course.name} due to constraint violations.`);
    }
}
console.log(JSON.stringify(schedule, null, 2));
