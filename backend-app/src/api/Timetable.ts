import * as fs from 'fs';
import * as path from 'path';
import { Course, CourseJson, InstructorJson, RoomJson, ExportJson, TimeList } from '../types/types';


// ファイルパスの定義
const coursesFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/Data/First_Courses.json';
const roomsFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/Data/Rooms.json';
const listFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData/TimeTables.json';
const directoryPath = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData';

const rst: TimeList = {
    TimeTables: loadTimeTables() || [] // 既存のタイムテーブルを読み込む
};

if (!Array.isArray(rst.TimeTables)) {
    rst.TimeTables = [];
}

// ファイルのロード関数
export function loadCourses(): Promise<CourseJson> {
    return new Promise<CourseJson>((resolve, reject) => {
        fs.readFile(coursesFile, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                try {
                    const jsonData = JSON.parse(data);
                    //console.log("Loaded Courses:", jsonData.Courses); // ここで読み込まれたデータを確認
                    resolve({ Course: jsonData.Courses });
                } catch (parseError) {
                    reject(parseError);
                }
            }
        });
    });
}

export function loadList(): Promise<TimeList> {
    return new Promise<TimeList>((resolve, reject) => {
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

// Function to load TimeTables.json
function loadTimeTables(): { id: string, name: string, file: string }[] {
    if (fs.existsSync(listFile)) {
        const data = fs.readFileSync(listFile, 'utf8');
        try {
            const jsonData = JSON.parse(data);
            if (Array.isArray(jsonData.TimeTables)) {
                return jsonData.TimeTables.map((entry: any) => ({
                    id: entry.id || '',  // idがない場合に備えて初期化
                    name: entry.name,
                    file: entry.file,
                }));
            }
        } catch (err) {
            console.error('Error parsing TimeTables.json:', err);
        }
    }
    return [];
}

// Function to save TimeTables.json
function saveTimeTables(timeTables: TimeList): void {
    const jsonData = JSON.stringify(timeTables, null, 2);
    fs.writeFileSync(listFile, jsonData, 'utf8');
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

export function write(data: ExportJson, id: string) {
    try {
        // Ensure TimeTables is initialized correctly as an array
        const rst: TimeList = {
            TimeTables: loadTimeTables() || [] // Load existing timetables
        };

        // Create directory if it doesn't exist
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
        }

        // Get list of files in the directory
        const files = fs.readdirSync(directoryPath);

        // Filter files starting with "Export"
        const exportFiles = files.filter(file => file.startsWith('Export') && file.endsWith('.json'));

        // Extract number from filenames and find the max number
        const maxNumber = exportFiles.reduce((max, file) => {
            const match = file.match(/^Export(\d+)\.json$/);
            if (match) {
                const num = parseInt(match[1], 10);
                return num > max ? num : max;
            }
            return max;
        }, 0);

        // Determine new file name
        const newFileNumber = maxNumber + 1;
        const fileName = `Export${newFileNumber}.json`;

        // Determine file path
        const filePath = path.join(directoryPath, fileName);

        // Ensure TimeTables is an array before pushing new entry
        if (!Array.isArray(rst.TimeTables)) {
            rst.TimeTables = [];
        }

        // Push new entry with id
        rst.TimeTables.push({
            id,  // 追加されたID
            name: fileName,
            file: filePath
        });

        // Write to TimeTables.json
        saveTimeTables(rst);

        // Display filename and path
        console.log('ファイル名:', fileName);
        console.log('ファイルパス:', filePath);

        // Write data to the output file
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

    } catch (error) {
        console.error('エクスポートファイルへのデータ書き込みエラー:', error);
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
function instructorAvailable(instructor: string, day: number, period: number, instructorsData: InstructorJson): boolean {
    //console.log(`Checking availability for instructor ${instructor} on day ${day}, period ${period}`);

    const instructorInfo = instructorsData.Instructor.find(i => i.id === instructor);
    if (!instructorInfo) {
        //console.log(`Instructor ${instructor} not found in data.`);
        return false;
    }

    // インストラクターの可用性を確認
    const availability = instructorInfo.periods.find(p => p.day === day && p.period === period);
    if (!availability) {
        //console.log(`Instructor ${instructor} is not available on day ${day}, period ${period}.`);
        return false;
    }

    //console.log(`Instructor ${instructor} is available on day ${day}, period ${period}.`);
    return true;
}

/*export function convert2(coursesData: CourseJson, instructorsData: InstructorJson, roomsData: RoomJson) {
    if (!coursesData || !coursesData.Course) {
        throw new Error('Invalid courses data');
    }

    const schedule: { [day: string]: { [period: number]: Course | null } } = {
        Monday: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null },
        Tuesday: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null },
        Wednesday: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null },
        Thursday: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null },
        Friday: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null },
    };

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

    const maxClassesPerDay = 4;

    const roomSchedule: { [day: string]: { [period: number]: string[] } } = {};
    for (const day of dayOfWeek) {
        roomSchedule[day] = {};
    }

    const scheduledCourses: Set<string> = new Set();

    function generateKey(course: Course, period: number, day: string): string {
        return `${course.name}-${course.targets.join(',')}-${period}-${day}`;
    }

    function isCourseScheduled(course: Course, period: number, day: string): boolean {
        // 全ての曜日をチェックして、すでにこのコースがスケジュールされていないか確認
        for (const scheduledDay of dayOfWeek) {
            if (Object.values(schedule[scheduledDay]).some(scheduledCourse => scheduledCourse?.name === course.name)) {
                return true;
            }
        }
        return false;
    }

    function addScheduledCourse(course: Course, period: number, day: string): void {
        if (!isCourseScheduled(course, period, day)) {
            schedule[day][period] = course;
        }
    }

    function removeCourse(course: Course) {
        const index = coursesData.Course.findIndex(c => c.name === course.name && c.targets === course.targets);
        if (index !== -1) {
            coursesData.Course.splice(index, 1);
        }
    }

    function scheduleCourse(course: Course, day: string, period: number) {
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
                period: period,
                length: 2
            },
        });
        addScheduledCourse(course, period, day);
    }

    function roomAvailable(room: string, day: string, period: number, roomSchedule: { [day: string]: { [period: number]: string[] } }): boolean {
        return !roomSchedule[day][period] || !roomSchedule[day][period].includes(room);
    }

    function instructorAvailable(instructor: string, day: number, period: number, instructorsData: InstructorJson): boolean {
        const instructorInfo = instructorsData.Instructor.find(i => i.id === instructor);
        if (!instructorInfo) {
            return false;
        }
        return !instructorInfo.periods.some(p => p.day === day && p.period === period);
    }

    // 非常勤の先生が担当する授業を先に格納する
    for (const dayIndex in dayOfWeek) {
        const day = dayOfWeek[dayIndex];

        for (const grade of gradeGroups) {
            for (const course of coursesData.Course) {
                if (course.targets.includes(grade)) {
                    const isPartTimeInstructor = course.instructors.some(inst => {
                        const instructorInfo = instructorsData.Instructor.find(i => i.id === inst);
                        return instructorInfo && !instructorInfo.isFullTime;
                    });

                    if (isPartTimeInstructor) {
                        for (let period = 1; period <= 4; period++) {
                            const roomAvailableValue = roomAvailable(course.rooms[0], day, period, roomSchedule);
                            const instructorAvailableValue = course.instructors.every(instructor => {
                                const available = instructorAvailable(instructor, parseInt(dayIndex) + 1, period, instructorsData);
                                return available;
                            });

                            if (roomAvailableValue && instructorAvailableValue && !isCourseScheduled(course, period, day)) {
                                scheduleCourse(course, day, period);
                                removeCourse(course);
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    // 常勤の先生が担当する授業を格納する
    /*for (const dayIndex in dayOfWeek) {
        const day = dayOfWeek[dayIndex];

        for (const grade of gradeGroups) {
            for (const course of coursesData.Course) {
                if (course.targets.includes(grade)) {
                    const isFullTimeInstructor = course.instructors.every(inst => {
                        const instructorInfo = instructorsData.Instructor.find(i => i.id === inst);
                        return instructorInfo && instructorInfo.isFullTime;
                    });

                    if (isFullTimeInstructor) {
                        for (let period = 1; period <= 8; period++) {
                            const roomAvailableValue = roomAvailable(course.rooms[0], day, period, roomSchedule);
                            const instructorAvailableValue = course.instructors.every(instructor => {
                                const available = instructorAvailable(instructor, parseInt(dayIndex) + 1, period, instructorsData);
                                return available;
                            });

                            if (roomAvailableValue && instructorAvailableValue && !isCourseScheduled(course, period, day)) {
                                scheduleCourse(course, day, period);
                                break;
                            }
                        }
                    }
                }
            }
        }
    }



    return rst;
}*/

// 変換関数
/*export function convert(coursesData: CourseJson, instructorsData: InstructorJson, roomsData: RoomJson): ExportJson {
    if (!coursesData || !coursesData.Course) {
        throw new Error('Invalid courses data');
    }

    const courseScheduled: { [courseName: string]: boolean } = {};
    const roomSchedule: { [key: string]: { [period: number]: string[] } } = {};
    const instructorSchedule: { [key: string]: { [period: number]: string[] } } = {};

    const gradeGroups = ['ME1', 'IE1', 'CA1', 'ME2', 'IE2', 'CA2', 'ME3', 'IE3', 'CA3', 'ME4', 'IE4', 'CA4', 'ME5', 'IE5', 'CA5'];
    const dayOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    for (const day of dayOfWeek) {
        roomSchedule[day] = {};
        instructorSchedule[day] = {};
    }

    const rst: ExportJson = {
        Days: dayOfWeek.map(day => ({
            Day: day,
            Classes: []
        }))
    };

    function isCourseScheduled(course: Course, period: number, day: string): boolean {
        return rst.Days.some(d => d.Day === day && d.Classes.some(c => c.Subject === course.name && c.periods.period === period && JSON.stringify(c.Targets) === JSON.stringify(course.targets)));
    }

    function isSlotOccupied(day: string, period: number): boolean {
        return rst.Days.some(d => d.Day === day && d.Classes.some(c => c.periods.period === period));
    }

    function isPartTimeInstructor(instructorId: string): boolean {
        const instructorInfo = instructorsData.Instructor.find(i => i.id === instructorId);
        return instructorInfo ? !instructorInfo.isFullTime : false;
    }

    function roomAvailable(room: string | undefined, day: string, period: number, roomSchedule: any): boolean {
        // 仮の実装
        return true;
    }

    function instructorAvailable(instructorId: string, day: number, period: number, instructorsData: InstructorJson): boolean {
        // 仮の実装
        return true;
    }

    function tryScheduleCourse(course: Course, day: string, period: number, grade: string): boolean {
        const roomAvailableValue = roomAvailable(course.rooms[0], day, period, roomSchedule);
        const instructorAvailableValue = course.instructors.every(instructorId => {
            return instructorAvailable(instructorId, dayOfWeek.indexOf(day) + 1, period + 1, instructorsData);
        });

        if (!roomAvailableValue || !instructorAvailableValue || isCourseScheduled(course, period, day) || isSlotOccupied(day, period)) {
            console.log(`Cannot schedule ${course.name} for ${grade} on ${day} during period ${period + 1}`);
            return false;
        }

        if (!roomSchedule[day][period]) {
            roomSchedule[day][period] = [];
        }
        roomSchedule[day][period].push(course.rooms[0]);

        if (!instructorSchedule[day][period]) {
            instructorSchedule[day][period] = [];
        }
        instructorSchedule[day][period].push(...course.instructors);

        const dayObj = rst.Days.find(d => d.Day === day);
        if (dayObj) {
            dayObj.Classes.push({
                Subject: course.name,
                Instructors: course.instructors,
                Rooms: course.rooms,
                Targets: course.targets,
                periods: {
                    period: period,
                    length: 2
                }
            });
        }

        courseScheduled[course.name] = true;

        // コースを削除する
        const index = coursesData.Course.indexOf(course);
        if (index !== -1) {
            coursesData.Course.splice(index, 1);
        }

        console.log(`Scheduled ${course.name} for ${grade} on ${day} during period ${period + 1}`);
        return true;
    }

    function findAlternativeSlot(course: Course, grade: string): boolean {
        for (const day of dayOfWeek) {
            for (let period = 0; period < 4; period++) {
                if (tryScheduleCourse(course, day, period, grade)) {
                    console.log(`Scheduled ${course.name} for ${grade} on ${day} during period ${period + 1} as an alternative.`);
                    return true;
                }
            }
        }
        return false;
    }

    function scheduleCourses(priorityFilter: (course: Course) => boolean) {
        for (const day of dayOfWeek) {
            for (const grade of gradeGroups) {
                for (const course of coursesData.Course) {
                    if (priorityFilter(course) && course.targets.includes(grade)) {
                        for (const periodInfo of course.periods) {
                            const courseDay = dayOfWeek[periodInfo.day - 1];
                            if (courseDay === day) {
                                const period = periodInfo.period - 1;

                                if (!courseScheduled[course.name]) {
                                    if (!tryScheduleCourse(course, day, period, grade)) {
                                        // 重複が発生する場合は、他の時間スロットを探す
                                        findAlternativeSlot(course, grade);
                                    }
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    function manuallyScheduleCourseAndRemove(course: Course, targetDay: string, targetPeriod: number, grade: string) {
        if (!courseScheduled[`${course.name}-${grade}`]) {
            if (!roomSchedule[targetDay]) {
                roomSchedule[targetDay] = {};
            }
            if (!roomSchedule[targetDay][targetPeriod]) {
                roomSchedule[targetDay][targetPeriod] = [];
            }
            roomSchedule[targetDay][targetPeriod].push(course.rooms[0]);

            if (!instructorSchedule[targetDay]) {
                instructorSchedule[targetDay] = {};
            }
            if (!instructorSchedule[targetDay][targetPeriod]) {
                instructorSchedule[targetDay][targetPeriod] = [];
            }
            instructorSchedule[targetDay][targetPeriod].push(...course.instructors);

            const dayObj = rst.Days.find(d => d.Day === targetDay);
            if (dayObj) {
                dayObj.Classes.push({
                    Subject: course.name,
                    Instructors: course.instructors,
                    Rooms: course.rooms,
                    Targets: course.targets,
                    periods: {
                        period: targetPeriod,
                        length: 2
                    }
                });
            }

            const index = coursesData.Course.indexOf(course);
            if (index !== -1) {
                coursesData.Course.splice(index, 1);
            }

            courseScheduled[`${course.name}-${grade}`] = true;
            console.log(`Manually scheduled ${course.name} for ${grade} on ${targetDay} during period ${targetPeriod + 1}`);
        } else {
            console.log(`Skipping manual scheduling for ${course.name} for ${grade} on ${targetDay} during period ${targetPeriod + 1}: Already scheduled.`);
        }
    }

    // 手動でのスケジュール例
    const courseCA4 = coursesData.Course.find(course => course.name === '総合英語演習I' && course.targets.includes('CA4'));
    if (courseCA4) {
        manuallyScheduleCourseAndRemove(courseCA4, 'Thursday', 3, 'CA4');
    }

    const courseIE4 = coursesData.Course.find(course => course.name === '総合英語演習I' && course.targets.includes('IE4'));
    if (courseIE4) {
        manuallyScheduleCourseAndRemove(courseIE4, 'Thursday', 2, 'IE4');
    }

    // スケジューリングの優先順位に基づく
    scheduleCourses(course => course.targets.length > 1 && course.instructors.some(isPartTimeInstructor));
    scheduleCourses(course => course.targets.length === 1 && course.instructors.some(isPartTimeInstructor));
    scheduleCourses(course => course.targets.length > 1 && !course.instructors.some(isPartTimeInstructor));
    scheduleCourses(course => course.targets.length === 1 && !course.instructors.some(isPartTimeInstructor));

    console.log('Remaining Courses:', coursesData.Course.map(course => `${course.name} ${course.targets}`));

    return rst;
}*/

export function convert3(coursesData: CourseJson, instructorsData: InstructorJson, roomsData: RoomJson) {
    if (!coursesData || !coursesData.Course) {
        throw new Error('Invalid courses data');
    }

    const createEmptySlot = () => ({
        courseName: "",
        instructors: [] as string[],
        rooms: [] as string[]
    });

    let gradeGroups = ['ME1', 'IE1', 'CA1', 'ME2', 'IE2', 'CA2', 'ME3', 'IE3', 'CA3', 'ME4', 'IE4', 'CA4', 'ME5', 'IE5', 'CA5'];
    const dayOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const maxPeriodsPerDay = 4;

    // シャッフル関数の定義
    function shuffleArray<T>(array: T[]): T[] {
        const shuffled = array.slice(); // 元の配列をコピー
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1)); // 0 ≤ j ≤ i
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // 要素を交換
        }
        return shuffled;
    }

    // シャッフルされたグ授業データを取得
    coursesData.Course = shuffleArray(coursesData.Course);

    // スケジュール管理用のデータ構造
    const scheduledCourses = new Set<string>(); // 既にスケジュールされた授業（授業名とターゲットクラスの組み合わせ）
    const instructorSchedule = Array.from({ length: dayOfWeek.length }, () =>
        Array.from({ length: maxPeriodsPerDay }, () => new Set<string>())
    );
    const roomSchedule = Array.from({ length: dayOfWeek.length }, () =>
        Array.from({ length: maxPeriodsPerDay }, () => new Set<string>())
    );

    // 各クラスの時間割を初期化
    const scheduled: {
        courseName: string;
        instructors: string[];
        rooms: string[];
    }[][][] = Array.from({ length: dayOfWeek.length }, () =>
        Array.from({ length: gradeGroups.length }, () =>
            Array.from({ length: maxPeriodsPerDay }, () => createEmptySlot())
        )
    );

    const rst: ExportJson = {
        Days: dayOfWeek.map(day => ({ Day: day, Classes: [] }))
    };

    //格納されなかった授業の総数をカウントする変数
    let unscheduledCoursesCount = 0;

    // 教員の空き時間を確認する関数
    const isInstructorAvailableAt = (instrId: string, dayIndex: number, period: number): boolean => {
        const instructor = instructorsData.Instructor.find(instr => instr.id === instrId);
        if (!instructor) return false; // 教員情報が見つからない場合は利用不可とする

        if (instructor.isFullTime) {
            return true; // 常勤教員は全時間帯で対応可能とみなす
        } else {
            // 非常勤教員の場合、指定された時間帯に対応可能か確認
            return instructor.periods.some(p => p.day === dayIndex + 1 && p.period === period + 1);
        }
    };

    // 各クラスごとにスケジューリング
    for (let gradeIndex = 0; gradeIndex < gradeGroups.length; gradeIndex++) {
        const gradeGroup = gradeGroups[gradeIndex];

        // このクラスをターゲットとする授業のリスト
        const availableCourses = coursesData.Course.filter(c => c.targets.includes(gradeGroup));

        // 授業の順序をシャッフル
        const shuffledAvailableCourses = shuffleArray(availableCourses);

        // 既にスケジュールされた授業を除外し、教員が存在する授業のみを選択
        const unscheduledCourses = shuffledAvailableCourses.filter(c => {
            // 授業名とターゲットクラスで一意に識別
            const courseIdentifier = c.name + "_" + gradeGroup;
            if (scheduledCourses.has(courseIdentifier)) return false;

            // 教員が存在するか確認
            const hasInstructors = c.instructors.every(instrId => {
                const instructor = instructorsData.Instructor.find(instr => instr.id === instrId);
                return instructor !== undefined;
            });

            return hasInstructors;
        });

        // 授業ごとにスケジューリング
        for (const course of unscheduledCourses) {
            let scheduledFlag = false;

            // 曜日と時限の順序をシャッフル（オプション）
            const shuffledDayIndices = shuffleArray([...Array(dayOfWeek.length).keys()]);
            const shuffledPeriodIndices = shuffleArray([...Array(maxPeriodsPerDay).keys()]);

            // 各曜日・時限を巡回してスケジュール可能か確認
            for (const dayIndex of shuffledDayIndices) {
                if (scheduledFlag) break;
                for (const period of shuffledPeriodIndices) {
                    if (scheduledFlag) break;

                    // 授業が指定する時間帯か確認
                    const isCourseAvailable = !course.periods || course.periods.some(p => p.day === dayIndex + 1 && p.period === period + 1);

                    if (!isCourseAvailable) continue; // 指定された時間帯でない場合はスキップ

                    // スロットが空いているか
                    if (scheduled[dayIndex][gradeIndex][period].courseName === "") {
                        // 教員が他の授業を担当していないか確認
                        const busyInstructors = instructorSchedule[dayIndex][period];
                        const isInstructorNotBusy = !course.instructors.some(instr => busyInstructors.has(instr));

                        // 教員がその時間帯に対応可能か確認
                        const isInstructorAvailable = course.instructors.every(instrId =>
                            isInstructorAvailableAt(instrId, dayIndex, period)
                        );

                        // 教室が他の授業で使用されていないか確認
                        const occupiedRooms = roomSchedule[dayIndex][period];
                        const isRoomAvailable = !course.rooms.some(room => occupiedRooms.has(room));

                        // ターゲットとなる他のクラスがその時間帯に空いているか確認（複数ターゲットの場合）
                        const areTargetClassesAvailable = course.targets.every(targetClass => {
                            const targetGradeIndex = gradeGroups.indexOf(targetClass);
                            return scheduled[dayIndex][targetGradeIndex][period].courseName === "";
                        });

                        if (isInstructorNotBusy && isInstructorAvailable && isRoomAvailable && areTargetClassesAvailable) {
                            // ターゲットとなる各クラスのスケジュールに追加
                            course.targets.forEach(targetClass => {
                                const targetGradeIndex = gradeGroups.indexOf(targetClass);
                                scheduled[dayIndex][targetGradeIndex][period] = {
                                    courseName: course.name,
                                    instructors: course.instructors,
                                    rooms: course.rooms
                                };
                            });

                            // 教員と教室のスケジュールを更新
                            course.instructors.forEach(instr => busyInstructors.add(instr));
                            course.rooms.forEach(room => occupiedRooms.add(room));

                            // rstに授業を追加
                            rst.Days[dayIndex].Classes.push({
                                Subject: course.name,
                                Instructors: course.instructors,
                                Rooms: course.rooms,
                                Targets: course.targets,
                                periods: {
                                    period: period,
                                    length: course.length // コマの長さ（必要に応じて調整）
                                },
                            });

                            // 授業をスケジュール済みとしてマーク（全ターゲットクラスについて）
                            course.targets.forEach(targetClass => {
                                const courseIdentifier = course.name + "_" + targetClass;
                                scheduledCourses.add(courseIdentifier);
                            });

                            scheduledFlag = true;
                        } else {
                            // デバッグ情報を出力（必要に応じてコメントアウト可能）
                            /*
                            if (!isInstructorNotBusy) {
                                console.log(`Cannot schedule ${course.name} for class ${gradeGroup} at day ${dayIndex + 1}, period ${period + 1}: Instructor is busy`);
                            }
                            if (!isInstructorAvailable) {
                                console.log(`Cannot schedule ${course.name} for class ${gradeGroup} at day ${dayIndex + 1}, period ${period + 1}: Instructor not available`);
                            }
                            if (!isRoomAvailable) {
                                console.log(`Cannot schedule ${course.name} for class ${gradeGroup} at day ${dayIndex + 1}, period ${period + 1}: Room not available`);
                            }
                            if (!areTargetClassesAvailable) {
                                console.log(`Cannot schedule ${course.name} at day ${dayIndex + 1}, period ${period + 1}: One or more target classes are not available`);
                            }
                            */
                        }
                    }
                }
            }

            // スケジュールに失敗した場合の処理
            if (!scheduledFlag) {
                //console.warn(`授業「${course.name}」をターゲットクラス「${course.targets.join(', ')}」にスケジュールできませんでした。`);
                unscheduledCoursesCount++;
            }
        }
    }

    // 以下、卒業研究のスケジューリング部分は変更なし
    interface GraduateResearchCourse {
        name: string;
        instructors: string[];
        targets: string[];
        rooms: string[];
        periods: { day: number; period: number }[];
        length: number;
    }

    const graduateResearchCourseME: GraduateResearchCourse = {
        name: '卒業研究',
        instructors: ['ME全員'],
        targets: ['ME5'],
        rooms: ['ME研究室'],
        periods: [],
        length: 2
    };

    const graduateResearchCourseIE: GraduateResearchCourse = {
        name: '卒業研究',
        instructors: ['IE全員'],
        targets: ['IE5'],
        rooms: ['IE研究室'],
        periods: [],
        length: 2
    };

    const graduateResearchCourseCA: GraduateResearchCourse = {
        name: '卒業研究',
        instructors: ['CA全員'],
        targets: ['CA5'],
        rooms: ['CA研究室'],
        periods: [],
        length: 2
    };

    // ターゲットクラスとコースをマッピング
    const graduateResearchCourseMap: { [key: string]: GraduateResearchCourse } = {
        'ME5': graduateResearchCourseME,
        'IE5': graduateResearchCourseIE,
        'CA5': graduateResearchCourseCA
    };

    ['ME5', 'IE5', 'CA5'].forEach(targetClass => {
        const gradeIndex = gradeGroups.indexOf(targetClass);

        const graduateResearchCourse = graduateResearchCourseMap[targetClass];

        if (!graduateResearchCourse) {
            throw new Error(`Unknown targetClass: ${targetClass}`);
        }

        // 曜日と時限の順序をシャッフル（オプション）
        const shuffledDayIndices = shuffleArray([...Array(dayOfWeek.length).keys()]);
        const shuffledPeriodIndices = shuffleArray([...Array(maxPeriodsPerDay).keys()]);

        for (const dayIndex of shuffledDayIndices) {
            for (const period of shuffledPeriodIndices) {
                // スロットが空いているか
                if (scheduled[dayIndex][gradeIndex][period].courseName === "") {
                    // スケジュール可能か確認
                    const isCourseAvailable = !graduateResearchCourse.periods.length || graduateResearchCourse.periods.some(p => p.day === dayIndex + 1 && p.period === period + 1);
                    if (!isCourseAvailable) continue;

                    // 教員が他の授業で忙しくないか確認
                    const busyInstructors = instructorSchedule[dayIndex][period];
                    const isInstructorNotBusy = !graduateResearchCourse.instructors.some(instr => busyInstructors.has(instr));

                    // 教員がその時間帯に対応可能か確認
                    const isInstructorAvailable = graduateResearchCourse.instructors.every(instrId =>
                        isInstructorAvailableAt(instrId, dayIndex, period)
                    );

                    // 教室が他の授業で使用されていないか確認
                    const occupiedRooms = roomSchedule[dayIndex][period];
                    const isRoomAvailable = !graduateResearchCourse.rooms.some(room => occupiedRooms.has(room));

                    if (isInstructorNotBusy && isInstructorAvailable && isRoomAvailable) {
                        // 時間割に追加
                        scheduled[dayIndex][gradeIndex][period] = {
                            courseName: graduateResearchCourse.name,
                            instructors: graduateResearchCourse.instructors,
                            rooms: graduateResearchCourse.rooms
                        };

                        // 教員と教室のスケジュールを更新
                        graduateResearchCourse.instructors.forEach(instr => busyInstructors.add(instr));
                        graduateResearchCourse.rooms.forEach(room => occupiedRooms.add(room));

                        // rstに授業を追加
                        rst.Days[dayIndex].Classes.push({
                            Subject: graduateResearchCourse.name,
                            Instructors: graduateResearchCourse.instructors,
                            Rooms: graduateResearchCourse.rooms,
                            Targets: graduateResearchCourse.targets,
                            periods: {
                                period: period,
                                length: 2
                            }
                        });

                        // 授業をスケジュール済みとしてマーク
                        const courseIdentifier = graduateResearchCourse.name + "_" + targetClass;
                        scheduledCourses.add(courseIdentifier);
                    }
                }
            }
        }
    });
    console.log("スケジュールされなかった授業の総数:", unscheduledCoursesCount);
    return rst;
}

//ファイルを全削除する関数
export function deleteALL() {
    try {
        // TimeTables.jsonを読み込む
        const data = fs.readFileSync(listFile, 'utf8');
        const jsonData: TimeList = JSON.parse(data);

        // TimeTables.json内の各ファイルを削除
        for (const timeTable of jsonData.TimeTables) {
            const filePath = timeTable.file;

            // ファイルが存在する場合に削除
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Deleted file: ${filePath}`);
            } else {
                console.warn(`File does not exist: ${filePath}`);
            }
        }
    } catch (error) {
        console.error('Error deleting files:', error);
    }
}

//ファイルを削除する関数
export function deleteFile(name: string) {
    try {
        const timeTables = loadTimeTables();
        const file = timeTables.find(f => f.name === name);
        if (file) {
            const filePath = file.file;
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                    console.log(`Deleted file: ${filePath}`);
                } catch (error) {
                    console.error(`Error deleting file ${filePath}:`, error);
                }
            } else {
                console.warn(`File not found: ${filePath}`);
            }
        } else {
            console.warn(`File not found: ${name}`);
        }
    } catch (error) {
        console.error('Error deleting file:', error);
    }
}
