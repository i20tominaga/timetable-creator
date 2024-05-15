// TimetableAPI.ts

import fs from 'fs';
const coursesFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/TestData/Test_Courses.json';
const instructorsFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/TestData/Test_Instructors.json';
const exportFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/TestData/Test2.json';
export function loadCourses() {
    return new Promise<any>((resolve, reject) => {
        fs.readFile(coursesFile, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                try {
                    const jsonData = JSON.parse(data);
                    console.log('Courses Data Loaded:', jsonData); // デバッグログ
                    resolve(jsonData.Courses);
                } catch (parseError) {
                    reject(parseError);
                }
            }
        });
    });
}

export function loadInstructors() {
    return new Promise<any>((resolve, reject) => {
        fs.readFile(instructorsFile, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                try {
                    const jsonData = JSON.parse(data);
                    console.log('Instructors Data Loaded:', jsonData); // デバッグログ
                    resolve(jsonData.Instructors);
                } catch (parseError) {
                    reject(parseError);
                }
            }
        });
    });
}

export function write(data: any) {
    fs.writeFileSync(exportFile, JSON.stringify(data, null, 2));
}


// TimetableAPI.ts

export function convert(coursesData: any[], instructorsData: any[]) {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const days: any[] = [];
    try {
        for (let i = 0; i < daysOfWeek.length; i++) {
            const dayOfWeek = daysOfWeek[i];
            const classes: any[] = [];

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
        }

        console.log('Converted Data:', { Days: days }); // Debug log for converted data
        return { Days: days };
    } catch (error) {
        console.error('Error converting data:', error);
        return { Days: [] };
    }
}
