import fs from 'fs';

//インターフェイスの定義
interface CourseJson {
    Course: {
        name: string;
        instructors: string[];
        targets: string[];
        rooms: string[];
        periods: {
            day: number;
            period: number;
        }[];
    }[];
};

interface InstructorJson {
    Instructor: {
        id: string;
        name: string;
        periods: {
            day: number;
            period: number;
        }[]
    }[];
};

interface RoomJson {
    Room: {
        name: string;
        capacity: number;
        unavailable: number;
    }[];
};

interface ExportJson {
    Days: {
        Day: string;
        Classes:{}[];
    }[];
}

// ファイルパスの定義
const coursesFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData/Courses.json';
const instructorsFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData/Instructors.json';
const roomsFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/Data/Rooms.json';
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

// 教室ファイルをロードする関数
export function loadRooms() {
    return new Promise<any>((resolve, reject) => {
        fs.readFile(roomsFile, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData.Rooms);
                } catch (parseError) {
                    reject(parseError);
                }
            }
        });
    });
}

// 出力ファイルにデータを書き込む関数
export function write(data: any) {
    try {
        fs.writeFileSync(exportFile, JSON.stringify(data, null, 4));
    } catch (error) {
        console.error('Error writing data to the export file:', error);
    }
}

// データ形式に変換する関数
export function convert2(coursesData: CourseJson, instructorsData: InstructorJson, roomsData: RoomJson) {
    const rst: ExportJson = {
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
    };  //結果を格納する配列
    const gradeGroups = ['ME1', 'IE1', 'CA1', 'ME2', 'IE2', 'CA2', 'ME3', 'IE3', 'CA3', 'ME4', 'IE4', 'CA4', 'ME5', 'IE5', 'CA5'];  //　クラスの定義
    const dayOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']; // 曜日の定義
    const timetable = Array.from({ length: 5 }, () => Array.from({ length: 15 }, () => Array.from({length: 4}, () => null)));  // 時間割の定義

    return rst;
}

// 各データを読み込み、変換し、結果を出力する例
async function main() {
    try {
        const courses = await loadCourses();
        const instructors = await loadInstructors();
        const rooms = await loadRooms();
        const result = convert2(courses, instructors, rooms);
        write(result);
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
