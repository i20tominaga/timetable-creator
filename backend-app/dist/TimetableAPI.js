"use strict";
// TimetableAPI.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadTeachers = exports.loadCourses = exports.write = exports.convert = void 0;
const fs_1 = __importDefault(require("fs"));
// 出力形式を要求された形式に変換する関数
function convert(timetableData) {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const days = [];
    const courses = timetableData.Courses.Courses;
    const instructors = timetableData.Instructors.Instructors;
    for (let i = 0; i < daysOfWeek.length; i++) {
        const dayOfWeek = daysOfWeek[i];
        const classes = [];
        for (let j = 0; j < 8; j++) {
            classes.push({
                subject: courses[i].name,
                teachers: courses[i].instructors,
                rooms: [courses[i].rooms],
                period: j + 1,
                length: 1
            });
        }
        days.push({
            Day: dayOfWeek,
            Classes: classes
        });
    }
    return { Days: days };
}
exports.convert = convert;
// ファイルに書き込む関数
function write(data) {
    return new Promise((resolve, reject) => {
        fs_1.default.writeFile('/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/TestData/Test2.json', JSON.stringify(data), (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
exports.write = write;
// JSONファイルからデータを読み込む関数
function loadCourses() {
    return new Promise((resolve, reject) => {
        // ファイルパスを修正する
        fs_1.default.readFile('/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/TestData/Test_Courses.json', 'utf8', (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                }
                catch (parseError) {
                    reject(parseError);
                }
            }
        });
    });
}
exports.loadCourses = loadCourses;
// JSONファイルからデータを読み込む関数
function loadTeachers() {
    return new Promise((resolve, reject) => {
        // ファイルパスを修正する
        fs_1.default.readFile('/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/TestData/Test_Instructor.json', 'utf8', (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                }
                catch (parseError) {
                    reject(parseError);
                }
            }
        });
    });
}
exports.loadTeachers = loadTeachers;
