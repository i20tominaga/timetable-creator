import fs from 'fs';

// インターフェイスの定義
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
}

interface InstructorJson {
    Instructor: {
        id: string;
        name: string;
        periods: {
            day: number;
            period: number;
        }[]
    }[];
}

interface RoomJson {
    Room: {
        name: string;
        capacity: number;
        unavailable: number;
    }[];
}

interface ExportJson {
    Days: {
        Day: string;
        Classes: {}[];
    }[];
}

// ファイルパスの定義
const coursesFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/Backend/SampleData/Courses.json';
const instructorsFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/Backend/SampleData/Instructors.json';
const roomsFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/Backend/Data/Rooms.json';
const exportFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/Backend/SampleData/Export.json';
const listFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/Backend/SampleData/TimeTables.json';

// ファイルのロード関数
export function loadCourses(): Promise<CourseJson> {
    return new Promise<CourseJson>((resolve, reject) => {
        fs.readFile(coursesFile, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ Course: jsonData.Courses });
                } catch (parseError) {
                    reject(parseError);
                }
            }
        });
    });
}

export function loadInstructors(): Promise<InstructorJson> {
    return new Promise<InstructorJson>((resolve, reject) => {
        fs.readFile(instructorsFile, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ Instructor: jsonData.Instructors });
                } catch (parseError) {
                    reject(parseError);
                }
            }
        });
    });
}

export function loadRooms(): Promise<RoomJson> {
    return new Promise<RoomJson>((resolve, reject) => {
        fs.readFile(roomsFile, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ Room: jsonData.Rooms });
                } catch (parseError) {
                    reject(parseError);
                }
            }
        });
    });
}

export function loadList(): Promise<ExportJson> {
    return new Promise<ExportJson>((resolve, reject) => {
        fs.readFile(listFile, 'utf8', (err, data) => {
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

export function loadDetail(name: string): Promise<ExportJson> {
    return new Promise<ExportJson>((resolve, reject) => {
        fs.readFile(name, 'utf8', (err, data) => {
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

// 出力ファイルにデータを書き込む関数
export function write(data: any) {
    try {
        fs.writeFileSync(exportFile, JSON.stringify(data, null, 4));
    } catch (error) {
        console.error('Error writing data to the export file:', error);
    }
}

export function writeList(data: any) {
    try {
        fs.writeFileSync(listFile, JSON.stringify(data, null, 4));
    } catch (error) {
        console.error('Error writing data to the list file:', error);
    }

}

// 各教室について、すでに使用されていないか確認する関数
function roomAvailable(room: string, day: string, period: number, roomSchedule: { [key: string]: { [period: number]: string[] } }) {
    if (!roomSchedule[day][period]) {
        roomSchedule[day][period] = [];
    }
    return !roomSchedule[day][period].includes(room);
}

// 教員が指定された時間に出勤可能か確認する関数
function instructorAvailable(instructor: string, day: number, period: number, instructorsData: InstructorJson) {
    const instructorInfo = instructorsData.Instructor.find(inst => inst.id === instructor);
    if (!instructorInfo || !instructorInfo.periods) {
        return false; // 出勤可能時間が指定されていない場合は出勤不可とみなす
    }
    return instructorInfo.periods.some(p => p.day === day && p.period === period);
}

// デバッグ用のログを追加する関数
function logAvailableInstructors(instructor: string, day: number, period: number, available: boolean) {
    console.log(`Instructor: ${instructor}, Day: ${day}, Period: ${period}, Available: ${available}`);
}

// データ形式に変換する関数
export function convert2(coursesData: CourseJson, instructorsData: InstructorJson, roomsData: RoomJson) {
    if (!coursesData || !coursesData.Course) {
        throw new Error('Invalid courses data');
    }

    const rst: ExportJson = {
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
    const roomSchedule: { [key: string]: { [period: number]: string[] } } = {};
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

                        rst.Days.find(d => d.Day === day)?.Classes.push({
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
