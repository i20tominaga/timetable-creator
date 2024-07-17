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
exports.deleteFile = exports.deleteALL = exports.convert2 = exports.writeList = exports.write = exports.loadDetail = exports.loadList = exports.loadRooms = exports.loadInstructors = exports.loadCourses = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// ファイルパスの定義
const coursesFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData/Courses.json';
const instructorsFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData/Instructors.json';
const roomsFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/Data/Rooms.json';
const listFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData/TimeTables.json';
const directoryPath = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData';
// ファイルのロード関数
function loadCourses() {
    return new Promise((resolve, reject) => {
        fs.readFile(coursesFile, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ Course: jsonData.Courses });
                }
                catch (parseError) {
                    reject(parseError);
                }
            }
        });
    });
}
exports.loadCourses = loadCourses;
function loadInstructors() {
    return new Promise((resolve, reject) => {
        fs.readFile(instructorsFile, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ Instructor: jsonData.Instructors });
                }
                catch (parseError) {
                    reject(parseError);
                }
            }
        });
    });
}
exports.loadInstructors = loadInstructors;
function loadRooms() {
    return new Promise((resolve, reject) => {
        fs.readFile(roomsFile, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ Room: jsonData.Rooms });
                }
                catch (parseError) {
                    reject(parseError);
                }
            }
        });
    });
}
exports.loadRooms = loadRooms;
function loadList() {
    return new Promise((resolve, reject) => {
        fs.readFile(listFile, 'utf8', (err, data) => {
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
exports.loadList = loadList;
function loadDetail(name) {
    return new Promise((resolve, reject) => {
        fs.readFile(name, 'utf8', (err, data) => {
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
exports.loadDetail = loadDetail;
// 出力ファイルにデータを書き込む関数
// TimeTables.jsonを読み込む関数
function loadTimeTables() {
    if (fs.existsSync(listFile)) {
        const data = fs.readFileSync(listFile, 'utf8');
        return JSON.parse(data);
    }
    return [];
}
// TimeTables.jsonに書き込む関数
function saveTimeTables(timeTables) {
    const jsonData = JSON.stringify(timeTables, null, 2);
    fs.writeFileSync(listFile, jsonData, 'utf8');
}
// 出力ファイルにデータを書き込む関数
function write(data) {
    try {
        // ディレクトリが存在しない場合は作成
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
        }
        // ディレクトリ内のファイル一覧を取得
        const files = fs.readdirSync(directoryPath);
        // "Export"で始まるファイル名をフィルタリング
        const exportFiles = files.filter(file => file.startsWith('Export') && file.endsWith('.json'));
        // ファイル名から番号を抽出して最大値を求める
        const maxNumber = exportFiles.reduce((max, file) => {
            const match = file.match(/^Export(\d+)\.json$/);
            if (match) {
                const num = parseInt(match[1], 10);
                return num > max ? num : max;
            }
            return max;
        }, 0);
        // 新しいファイル名を決定
        const newFileNumber = maxNumber + 1;
        const fileName = `Export${newFileNumber}.json`;
        // ファイルのパス
        const filePath = path.join(directoryPath, fileName);
        // JSONデータを書き込む
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        // TimeTables.jsonの読み込み
        let timeTables = loadTimeTables();
        // 新しいエントリを追加
        timeTables.push({
            name: `Export${newFileNumber}`,
            file: filePath
        });
        // TimeTables.jsonに書き込む
        saveTimeTables(timeTables);
        // ファイル名とパスを表示
        console.log('ファイル名:', fileName);
        console.log('ファイルパス:', filePath);
    }
    catch (error) {
        console.error('Error writing data to the export file:', error);
    }
}
exports.write = write;
function writeList(data) {
    try {
        fs.writeFileSync(listFile, JSON.stringify(data, null, 4));
    }
    catch (error) {
        console.error('Error writing data to the list file:', error);
    }
}
exports.writeList = writeList;
// 各教室について、すでに使用されていないか確認する関数
function roomAvailable(room, day, period, roomSchedule) {
    if (!roomSchedule[day][period]) {
        roomSchedule[day][period] = [];
    }
    return !roomSchedule[day][period].includes(room);
}
// 教員が指定された時間に出勤可能か確認する関数
function instructorAvailable(instructor, day, period, instructorsData) {
    const instructorInfo = instructorsData.Instructor.find(inst => inst.id === instructor);
    if (!instructorInfo || !instructorInfo.periods) {
        return false; // 出勤可能時間が指定されていない場合は出勤不可とみなす
    }
    return instructorInfo.periods.some(p => p.day === day && p.period === period);
}
// デバッグ用のログを追加する関数
function logAvailableInstructors(instructor, day, period, available) {
    console.log(`Instructor: ${instructor}, Day: ${day}, Period: ${period}, Available: ${available}`);
}
// データ形式に変換する関数
function convert2(coursesData, instructorsData, roomsData) {
    var _a;
    if (!coursesData || !coursesData.Course) {
        throw new Error('Invalid courses data');
    }
    const rst = {
        Days: [
            { Day: 'Monday', Classes: [] },
            { Day: 'Tuesday', Classes: [] },
            { Day: 'Wednesday', Classes: [] },
            { Day: 'Thursday', Classes: [] },
            { Day: 'Friday', Classes: [] }
        ]
    };
    const gradeGroups = ['ME1', 'IE1', 'CA1', 'ME2', 'IE2', 'CA2', 'ME3', 'IE3', 'CA3', 'ME4', 'IE4', 'CA4', 'ME5', 'IE5', 'CA5'];
    const dayOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    // 1日の最大授業数
    const maxClassesPerDay = 4;
    // 各曜日ごとのコマと教室の使用状況を追跡する
    const roomSchedule = {};
    for (const day of dayOfWeek) {
        roomSchedule[day] = {};
    }
    for (const dayIndex in dayOfWeek) {
        const day = dayOfWeek[dayIndex];
        let dayClassesCount = 0;
        for (const grade of gradeGroups) {
            let gradeClassesCount = 0;
            for (const course of coursesData.Course) {
                if (course.targets.includes(grade) && gradeClassesCount < maxClassesPerDay && dayClassesCount < maxClassesPerDay * gradeGroups.length) {
                    const period = gradeClassesCount; // periodを設定
                    const roomAvailableValue = roomAvailable(course.rooms[0], day, period, roomSchedule);
                    const instructorAvailableValue = course.instructors.every(instructor => {
                        const available = instructorAvailable(instructor, parseInt(dayIndex) + 1, period + 1, instructorsData);
                        logAvailableInstructors(instructor, parseInt(dayIndex) + 1, period + 1, available);
                        return available;
                    });
                    if (roomAvailableValue && instructorAvailableValue) {
                        // 各教室を使用中としてマークする
                        if (!roomSchedule[day][period]) {
                            roomSchedule[day][period] = [];
                        }
                        roomSchedule[day][period].push(course.rooms[0]);
                        (_a = rst.Days.find(d => d.Day === day)) === null || _a === void 0 ? void 0 : _a.Classes.push({
                            Subject: course.name,
                            Instructors: course.instructors,
                            Rooms: course.rooms,
                            Targets: course.targets,
                            periods: {
                                period: gradeClassesCount, // periodを設定
                                length: 2
                            },
                        });
                        gradeClassesCount++;
                        dayClassesCount++;
                    }
                }
            }
        }
    }
    // 書き込むデータをエクスポート
    write(rst);
    return rst;
}
exports.convert2 = convert2;
//ファイルを全削除する関数
function deleteALL() {
    try {
        const timeTables = loadTimeTables();
        for (let i = 0; i < timeTables.length; i++) {
            const filePath = timeTables[i].file;
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                    console.log(`Deleted file: ${filePath}`);
                }
                catch (error) {
                    console.error(`Error deleting file ${filePath}:`, error);
                }
            }
            else {
                console.warn(`File not found: ${filePath}`);
            }
        }
    }
    catch (error) {
        console.error('Error deleting file:', error);
    }
}
exports.deleteALL = deleteALL;
//ファイルを削除する関数
function deleteFile(name) {
    try {
        const timeTables = loadTimeTables();
        const file = timeTables.find(f => f.name === name);
        if (file) {
            const filePath = file.file;
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                    console.log(`Deleted file: ${filePath}`);
                }
                catch (error) {
                    console.error(`Error deleting file ${filePath}:`, error);
                }
            }
            else {
                console.warn(`File not found: ${filePath}`);
            }
        }
        else {
            console.warn(`File not found: ${name}`);
        }
    }
    catch (error) {
        console.error('Error deleting file:', error);
    }
}
exports.deleteFile = deleteFile;
