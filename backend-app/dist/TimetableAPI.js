"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convert = exports.write = exports.loadInstructors = exports.loadCourses = void 0;
const fs_1 = __importDefault(require("fs"));
// ファイルパスの定義
const coursesFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData/Courses.json';
const instructorsFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData/Instructors.json';
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
                    console.log('Courses Data Loaded:', jsonData); // デバッグログ
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
// 出力ファイルにデータを書き込む関数
function write(data) {
    fs_1.default.writeFileSync(exportFile, JSON.stringify(data, null, 4));
}
exports.write = write;
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
// 出力形式に変換する関数
function convert(coursesData, instructorsData) {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const days = [];
    const shuffledCourses = shuffleArray([...coursesData]); // コースデータをシャッフル
    // 学年ごとにターゲットグループを定義
    const gradeGroups = {
        1: ['ME1', 'IE1', 'CA1'],
        2: ['ME2', 'IE2', 'CA2'],
        3: ['ME3', 'IE3', 'CA3'],
        4: ['ME4', 'IE4', 'CA4'],
        5: ['ME5', 'IE5', 'CA5'],
        // 追加の学年があればここに追加
    };
    try {
        for (let i = 0; i < daysOfWeek.length; i++) {
            const dayOfWeek = daysOfWeek[i];
            const classes = [];
            // 各学年ごとにループ
            for (const gradeStr in gradeGroups) {
                const grade = Number(gradeStr);
                const targetGroups = gradeGroups[grade];
                for (const target of targetGroups) {
                    let targetCount = 0;
                    for (let j = 0; j < shuffledCourses.length && targetCount < 4; j++) {
                        const course = shuffledCourses[j];
                        if (course.targets.includes(target)) {
                            classes.push({
                                Subject: course.name,
                                Instructors: course.instructors,
                                targets: course.targets,
                                Rooms: course.rooms,
                                Periods: 1,
                                Length: 2
                            });
                            targetCount++;
                        }
                    }
                }
            }
            days.push({
                Day: dayOfWeek,
                Classes: classes
            });
        }
        return { Days: days };
    }
    catch (error) {
        console.error('Error converting data:', error);
        return { Days: [] };
    }
}
exports.convert = convert;
