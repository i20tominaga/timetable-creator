"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convert2 = exports.write = exports.loadRooms = exports.loadInstructors = exports.loadCourses = void 0;
const fs_1 = __importDefault(require("fs"));
;
;
;
// ファイルパスの定義
const coursesFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData/Courses.json';
const instructorsFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData/Instructors.json';
const roomsFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/Data/Rooms.json';
const exportFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData/Export.json';
// 授業ファイルをロードする関数
function loadCourses() {
    return new Promise((resolve, reject) => {
        fs_1.default.readFile(coursesFile, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData.Courses);
                }
                catch (parseError) {
                    reject(parseError);
                }
            }
        });
    });
}
exports.loadCourses = loadCourses;
// 教員ファイルをロードする関数
function loadInstructors() {
    return new Promise((resolve, reject) => {
        fs_1.default.readFile(instructorsFile, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData.Instructors);
                }
                catch (parseError) {
                    reject(parseError);
                }
            }
        });
    });
}
exports.loadInstructors = loadInstructors;
// 教室ファイルをロードする関数
function loadRooms() {
    return new Promise((resolve, reject) => {
        fs_1.default.readFile(roomsFile, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData.Rooms);
                }
                catch (parseError) {
                    reject(parseError);
                }
            }
        });
    });
}
exports.loadRooms = loadRooms;
// 出力ファイルにデータを書き込む関数
function write(data) {
    try {
        fs_1.default.writeFileSync(exportFile, JSON.stringify(data, null, 4));
    }
    catch (error) {
        console.error('Error writing data to the export file:', error);
    }
}
exports.write = write;
// データ形式に変換する関数
function convert2(coursesData, instructorsData, roomsData) {
    const rst = {
        Days: [
            {
                Day: 'Monday',
                Classes: []
            },
            {
                Day: 'Tuesday',
                Classes: []
            },
            {
                Day: 'Wednesday',
                Classes: []
            },
            {
                Day: 'Thursday',
                Classes: []
            },
            {
                Day: 'Friday',
                Classes: []
            }
        ]
    }; //結果を格納する配列
    const gradeGroups = ['ME1', 'IE1', 'CA1', 'ME2', 'IE2', 'CA2', 'ME3', 'IE3', 'CA3', 'ME4', 'IE4', 'CA4', 'ME5', 'IE5', 'CA5']; //　クラスの定義
    const dayOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']; // 曜日の定義
    const timetable = Array.from({ length: 5 }, () => Array.from({ length: 15 }, () => Array.from({ length: 4 }, () => null))); // 時間割の定義
    return rst;
}
exports.convert2 = convert2;
// 各データを読み込み、変換し、結果を出力する例
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const courses = yield loadCourses();
            const instructors = yield loadInstructors();
            const rooms = yield loadRooms();
            console.log(rooms);
            const result = convert2(courses, instructors, rooms);
            write(result);
        }
        catch (error) {
            console.error('Error:', error);
        }
    });
}
main();
