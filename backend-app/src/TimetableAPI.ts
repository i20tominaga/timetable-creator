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
                    console.log('Courses Data Loaded:', jsonData); // デバッグログ
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

// 出力形式に変換する関数
export function convert(coursesData: any[], instructorsData: any[]) {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const days: any[] = [];
    const shuffledCourses = shuffleArray([...coursesData]); // コースデータをシャッフル

    // 学年ごとにターゲットグループを定義
    const gradeGroups: { [key: number]: string[] } = {
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
            const classes: any[] = [];

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
    } catch (error) {
        console.error('Error converting data:', error);
        return { Days: [] };
    }
}
