"use strict";
// TimetableAPI.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convert = exports.write = exports.loadInstructors = exports.loadCourses = void 0;
const fs_1 = __importDefault(require("fs"));
const coursesFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/TestData/Test_Courses.json';
const instructorsFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/TestData/Test_Instructors.json';
const exportFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/TestData/Test2.json';
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
function loadInstructors() {
    return new Promise((resolve, reject) => {
        fs_1.default.readFile(instructorsFile, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                try {
                    const jsonData = JSON.parse(data);
                    console.log('Instructors Data Loaded:', jsonData); // デバッグログ
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
function write(data) {
    fs_1.default.writeFileSync(exportFile, JSON.stringify(data, null, 2));
}
exports.write = write;
// TimetableAPI.ts
function convert(coursesData, instructorsData) {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const days = [];
    try {
        for (let i = 0; i < daysOfWeek.length; i++) {
            const dayOfWeek = daysOfWeek[i];
            const classes = [];
            for (let j = 0; j < 4; j++) {
                classes.push({
                    Subject: coursesData[j].name,
                    Instructors: coursesData[j].instructors,
                    Rooms: coursesData[j].rooms,
                    Periods: 1,
                    Length: 2
                });
            }
            days.push({
                Day: dayOfWeek,
                Classes: classes
            });
            console.log('Days:', days); // Debug log for days array
        }
        console.log('Converted Data:', { Days: days }); // Debug log for converted data
        return { Days: days };
    }
    catch (error) {
        console.error('Error converting data:', error);
        return { Days: [] };
    }
}
exports.convert = convert;
