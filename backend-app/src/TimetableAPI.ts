// TimetableAPI.ts

import fs from 'fs';

// 出力形式を要求された形式に変換する関数
export function convert(timetableData: any) {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const days: any[] = [];
    const courses = timetableData.Courses.Courses;
    const instructors = timetableData.Instructors.Instructors;

    for (let i = 0; i < daysOfWeek.length; i++) {
        const dayOfWeek = daysOfWeek[i];
        const classes: any[] = [];

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

// ファイルに書き込む関数
export function write(data: any) {
    return new Promise<void>((resolve, reject) => {
        fs.writeFile('/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/TestData/Test2.json', JSON.stringify(data), (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

// JSONファイルからデータを読み込む関数
export function loadCourses() {
    return new Promise<any>((resolve, reject) => {
        // ファイルパスを修正する
        fs.readFile('/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/TestData/Test_Courses.json', 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (parseError) {
                    reject(parseError);
                }
            }
        });
    });
}

// JSONファイルからデータを読み込む関数
export function loadTeachers() {
    return new Promise<any>((resolve, reject) => {
        // ファイルパスを修正する
        fs.readFile('/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/TestData/Test_Instructor.json', 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (parseError) {
                    reject(parseError);
                }
            }
        });
    });
}