import fs from 'fs';

// ファイルパスの定義
const coursesFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData/Courses.json';
const instructorsFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData/Instructors.json';
const exportFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData/Export.json';

// 授業ファイルをロードする関数
export function loadCourses() {
    return new Promise<any>((resolve, reject) => {
        fs.readFile(coursesFile, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData.Courses);
                } catch (parseError) {
                    reject(parseError);
                }
            }
        });
    });
}

// 教員ファイルをロードする関数
export function loadInstructors() {
    return new Promise<any>((resolve, reject) => {
        fs.readFile(instructorsFile, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData.Instructors);
                } catch (parseError) {
                    reject(parseError);
                }
            }
        });
    });
}

// 出力ファイルにデータを書き込む関数
export function write(data: any) {
    fs.writeFileSync(exportFile, JSON.stringify(data, null, 4));
}

function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// インデックス取得用のマップ
const gradeGroups = ['ME1', 'IE1', 'CA1', 'ME2', 'IE2', 'CA2', 'ME3', 'IE3', 'CA3', 'ME4', 'IE4', 'CA4', 'ME5', 'IE5', 'CA5'];
const groupIndex = (grade: string) => gradeGroups.indexOf(grade);

function addCourseToSchedule(course: any, period: number, scheduleMatrix: string[][], usedInstructors: Set<string>) {
    if (!scheduleMatrix[period - 1]) {
        scheduleMatrix[period - 1] = Array(21).fill(null);
    }

    for (const target of course.targets) {
        const colIndex = groupIndex(target);
        if (colIndex === -1) continue;

        for (const instructor of course.instructors) {
            if (usedInstructors.has(instructor)) {
                return false; // コンフリクトがある場合は追加しない
            }
        }

        scheduleMatrix[period - 1][colIndex] = course.instructors.join(', ');
    }

    for (const instructor of course.instructors) {
        usedInstructors.add(instructor);
    }

    return true;
}

export function convert(coursesData: any[], instructorsData: any[]) {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const days: any[] = [];
    const gradeGroups: { [key: number]: string[] } = {
        1: ['ME1', 'IE1', 'CA1'],
        2: ['ME2', 'IE2', 'CA2'],
        3: ['ME3', 'IE3', 'CA3'],
        4: ['ME4', 'IE4', 'CA4'],
        5: ['ME5', 'IE5', 'CA5'],
    };

    try {
        for (let i = 0; i < daysOfWeek.length; i++) {
            const dayOfWeek = daysOfWeek[i];
            const classes: any[] = [];
            const scheduleMatrix: string[][] = Array.from({ length: 4 }, () => Array(21).fill(null));
            const usedInstructors = new Set<string>();
            const shuffledCourses = shuffleArray([...coursesData]);

            for (const gradeStr in gradeGroups) {
                const grade = Number(gradeStr);
                const targetGroups = gradeGroups[grade];

                for (const target of targetGroups) {
                    let currentPeriod = 1;
                    let targetCount = 0;

                    for (let j = 0; j < shuffledCourses.length && targetCount < 4; j++) {
                        const course = shuffledCourses[j];
                        if (course && course.targets && course.targets.includes(target)) {
                            if (addCourseToSchedule(course, currentPeriod, scheduleMatrix, usedInstructors)) {
                                classes.push({
                                    Subject: course.name,
                                    Instructors: course.instructors,
                                    Targets: course.targets,
                                    Rooms: course.rooms,
                                    Periods: currentPeriod,
                                    Length: 2
                                });
                                targetCount++;
                                currentPeriod += 2;
                            }
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
    } catch (error) {
        console.error('Error converting data:', error);
        return { Days: [] };
    }
}
