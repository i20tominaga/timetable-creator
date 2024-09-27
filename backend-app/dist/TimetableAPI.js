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
exports.deleteFile = exports.deleteALL = exports.convert3 = exports.convert = exports.convert2 = exports.writeList = exports.write = exports.loadDetail = exports.loadList = exports.loadRooms = exports.loadInstructors = exports.loadCourses = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
;
// ファイルパスの定義
const coursesFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData/Courses.json';
const instructorsFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData/Instructors.json';
const roomsFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/Data/Rooms.json';
const listFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData/TimeTables.json';
const directoryPath = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData';
const rst = {
    TimeTables: loadTimeTables() || [] // 既存のタイムテーブルを読み込む
};
if (!Array.isArray(rst.TimeTables)) {
    rst.TimeTables = [];
}
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
                    console.log("Loaded Courses:", jsonData.Courses); // ここで読み込まれたデータを確認
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
// Function to load TimeTables.json
function loadTimeTables() {
    if (fs.existsSync(listFile)) {
        const data = fs.readFileSync(listFile, 'utf8');
        try {
            const jsonData = JSON.parse(data);
            if (Array.isArray(jsonData.TimeTables)) {
                return jsonData.TimeTables.map((entry) => ({
                    id: entry.id || '', // idがない場合に備えて初期化
                    name: entry.name,
                    file: entry.file,
                }));
            }
        }
        catch (err) {
            console.error('Error parsing TimeTables.json:', err);
        }
    }
    return [];
}
// Function to save TimeTables.json
function saveTimeTables(timeTables) {
    const jsonData = JSON.stringify(timeTables, null, 2);
    fs.writeFileSync(listFile, jsonData, 'utf8');
}
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
function write(data, id) {
    try {
        // Ensure TimeTables is initialized correctly as an array
        const rst = {
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
            id, // 追加されたID
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
    }
    catch (error) {
        console.error('エクスポートファイルへのデータ書き込みエラー:', error);
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
    console.log(`Checking availability for instructor ${instructor} on day ${day}, period ${period}`);
    const instructorInfo = instructorsData.Instructor.find(i => i.id === instructor);
    if (!instructorInfo) {
        console.log(`Instructor ${instructor} not found in data.`);
        return false;
    }
    // インストラクターの可用性を確認
    const availability = instructorInfo.periods.find(p => p.day === day && p.period === period);
    if (!availability) {
        console.log(`Instructor ${instructor} is not available on day ${day}, period ${period}.`);
        return false;
    }
    console.log(`Instructor ${instructor} is available on day ${day}, period ${period}.`);
    return true;
}
function convert2(coursesData, instructorsData, roomsData) {
    if (!coursesData || !coursesData.Course) {
        throw new Error('Invalid courses data');
    }
    const schedule = {
        Monday: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null },
        Tuesday: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null },
        Wednesday: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null },
        Thursday: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null },
        Friday: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null },
    };
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
    const maxClassesPerDay = 4;
    const roomSchedule = {};
    for (const day of dayOfWeek) {
        roomSchedule[day] = {};
    }
    const scheduledCourses = new Set();
    function generateKey(course, period, day) {
        return `${course.name}-${course.targets.join(',')}-${period}-${day}`;
    }
    function isCourseScheduled(course, period, day) {
        // 全ての曜日をチェックして、すでにこのコースがスケジュールされていないか確認
        for (const scheduledDay of dayOfWeek) {
            if (Object.values(schedule[scheduledDay]).some(scheduledCourse => (scheduledCourse === null || scheduledCourse === void 0 ? void 0 : scheduledCourse.name) === course.name)) {
                return true;
            }
        }
        return false;
    }
    function addScheduledCourse(course, period, day) {
        if (!isCourseScheduled(course, period, day)) {
            schedule[day][period] = course;
        }
    }
    function removeCourse(course) {
        const index = coursesData.Course.findIndex(c => c.name === course.name && c.targets === course.targets);
        if (index !== -1) {
            coursesData.Course.splice(index, 1);
        }
    }
    function scheduleCourse(course, day, period) {
        var _a;
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
                period: period,
                length: 2
            },
        });
        addScheduledCourse(course, period, day);
    }
    function roomAvailable(room, day, period, roomSchedule) {
        return !roomSchedule[day][period] || !roomSchedule[day][period].includes(room);
    }
    function instructorAvailable(instructor, day, period, instructorsData) {
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
    }*/
    return rst;
}
exports.convert2 = convert2;
// 変換関数
function convert(coursesData, instructorsData, roomsData) {
    if (!coursesData || !coursesData.Course) {
        throw new Error('Invalid courses data');
    }
    const courseScheduled = {};
    const roomSchedule = {};
    const instructorSchedule = {};
    const gradeGroups = ['ME1', 'IE1', 'CA1', 'ME2', 'IE2', 'CA2', 'ME3', 'IE3', 'CA3', 'ME4', 'IE4', 'CA4', 'ME5', 'IE5', 'CA5'];
    const dayOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    for (const day of dayOfWeek) {
        roomSchedule[day] = {};
        instructorSchedule[day] = {};
    }
    const rst = {
        Days: dayOfWeek.map(day => ({
            Day: day,
            Classes: []
        }))
    };
    function isCourseScheduled(course, period, day) {
        return rst.Days.some(d => d.Day === day && d.Classes.some(c => c.Subject === course.name && c.periods.period === period && JSON.stringify(c.Targets) === JSON.stringify(course.targets)));
    }
    function isSlotOccupied(day, period) {
        return rst.Days.some(d => d.Day === day && d.Classes.some(c => c.periods.period === period));
    }
    function isPartTimeInstructor(instructorId) {
        const instructorInfo = instructorsData.Instructor.find(i => i.id === instructorId);
        return instructorInfo ? !instructorInfo.isFullTime : false;
    }
    function roomAvailable(room, day, period, roomSchedule) {
        // 仮の実装
        return true;
    }
    function instructorAvailable(instructorId, day, period, instructorsData) {
        // 仮の実装
        return true;
    }
    function tryScheduleCourse(course, day, period, grade) {
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
    function findAlternativeSlot(course, grade) {
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
    function scheduleCourses(priorityFilter) {
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
    function manuallyScheduleCourseAndRemove(course, targetDay, targetPeriod, grade) {
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
        }
        else {
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
}
exports.convert = convert;
function convert3(coursesData, instructorsData, roomsData) {
    if (!coursesData || !coursesData.Course) {
        throw new Error('Invalid courses data');
    }
    const createEmptySlot = () => ({
        courseName: "",
        instructors: [],
        rooms: []
    });
    const gradeGroups = ['ME1', 'IE1', 'CA1', 'ME2', 'IE2', 'CA2', 'ME3', 'IE3', 'CA3', 'ME4', 'IE4', 'CA4', 'ME5', 'IE5', 'CA5'];
    const dayOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const maxPeriodsPerDay = 4;
    // スケジュール管理用のデータ構造
    const scheduledCourses = new Set(); // 既にスケジュールされた授業（授業名とターゲットクラスの組み合わせ）
    const instructorSchedule = Array.from({ length: dayOfWeek.length }, () => Array.from({ length: maxPeriodsPerDay }, () => new Set()));
    const roomSchedule = Array.from({ length: dayOfWeek.length }, () => Array.from({ length: maxPeriodsPerDay }, () => new Set()));
    // 各クラスの時間割を初期化
    const scheduled = Array.from({ length: dayOfWeek.length }, () => Array.from({ length: gradeGroups.length }, () => Array.from({ length: maxPeriodsPerDay }, () => createEmptySlot())));
    const rst = {
        Days: dayOfWeek.map(day => ({ Day: day, Classes: [] }))
    };
    // 教員の空き時間を確認する関数
    const isInstructorAvailableAt = (instrId, dayIndex, period) => {
        const instructor = instructorsData.Instructor.find(instr => instr.id === instrId);
        if (!instructor)
            return false; // 教員情報が見つからない場合は利用不可とする
        if (instructor.isFullTime) {
            return true; // 常勤教員は全時間帯で対応可能とみなす
        }
        else {
            // 非常勤教員の場合、指定された時間帯に対応可能か確認
            return instructor.periods.some(p => p.day === dayIndex + 1 && p.period === period + 1);
        }
    };
    // 各クラスごとにスケジューリング
    for (let gradeIndex = 0; gradeIndex < gradeGroups.length; gradeIndex++) {
        const gradeGroup = gradeGroups[gradeIndex];
        // このクラスをターゲットとする授業のリスト
        const availableCourses = coursesData.Course.filter(c => c.targets.includes(gradeGroup));
        // 既にスケジュールされた授業を除外し、教員が存在する授業のみを選択
        const unscheduledCourses = availableCourses.filter(c => {
            // 授業名とターゲットクラスで一意に識別
            const courseIdentifier = c.name + "_" + gradeGroup;
            if (scheduledCourses.has(courseIdentifier))
                return false;
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
            // 各曜日・時限を巡回してスケジュール可能か確認
            for (let dayIndex = 0; dayIndex < dayOfWeek.length && !scheduledFlag; dayIndex++) {
                for (let period = 0; period < maxPeriodsPerDay && !scheduledFlag; period++) {
                    // 授業が指定する時間帯か確認
                    const isCourseAvailable = !course.periods || course.periods.some(p => p.day === dayIndex + 1 && p.period === period + 1);
                    if (!isCourseAvailable)
                        continue; // 指定された時間帯でない場合はスキップ
                    // スロットが空いているか
                    if (scheduled[dayIndex][gradeIndex][period].courseName === "") {
                        // 教員が他の授業を担当していないか確認
                        const busyInstructors = instructorSchedule[dayIndex][period];
                        const isInstructorNotBusy = !course.instructors.some(instr => busyInstructors.has(instr));
                        // 教員がその時間帯に対応可能か確認
                        const isInstructorAvailable = course.instructors.every(instrId => isInstructorAvailableAt(instrId, dayIndex, period));
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
                                    length: 1 // コマの長さ（必要に応じて調整）
                                }
                            });
                            // 授業をスケジュール済みとしてマーク（全ターゲットクラスについて）
                            course.targets.forEach(targetClass => {
                                const courseIdentifier = course.name + "_" + targetClass;
                                scheduledCourses.add(courseIdentifier);
                            });
                            scheduledFlag = true;
                        }
                        else {
                            // デバッグ情報を出力
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
                        }
                    }
                }
            }
            // スケジュールに失敗した場合の処理
            if (!scheduledFlag) {
                console.warn(`授業「${course.name}」をターゲットクラス「${course.targets.join(', ')}」にスケジュールできませんでした。`);
            }
        }
    }
    const graduateResearchCourseME = {
        name: '卒業研究',
        instructors: ['ME全員'],
        targets: ['ME5'],
        rooms: ['ME研究室'],
        periods: []
    };
    const graduateResearchCourseIE = {
        name: '卒業研究',
        instructors: ['IE全員'],
        targets: ['IE5'],
        rooms: ['IE研究室'],
        periods: []
    };
    const graduateResearchCourseCA = {
        name: '卒業研究',
        instructors: ['CA全員'],
        targets: ['CA5'],
        rooms: ['CA研究室'],
        periods: []
    };
    // ターゲットクラスとコースをマッピング
    const graduateResearchCourseMap = {
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
        for (let dayIndex = 0; dayIndex < dayOfWeek.length; dayIndex++) {
            for (let period = 0; period < maxPeriodsPerDay; period++) {
                // スロットが空いているか
                if (scheduled[dayIndex][gradeIndex][period].courseName === "") {
                    // スケジュール可能か確認
                    const isCourseAvailable = !graduateResearchCourse.periods.length || graduateResearchCourse.periods.some(p => p.day === dayIndex + 1 && p.period === period + 1);
                    if (!isCourseAvailable)
                        continue;
                    // 教員が他の授業で忙しくないか確認
                    const busyInstructors = instructorSchedule[dayIndex][period];
                    const isInstructorNotBusy = !graduateResearchCourse.instructors.some(instr => busyInstructors.has(instr));
                    // 教員がその時間帯に対応可能か確認
                    const isInstructorAvailable = graduateResearchCourse.instructors.every(instrId => isInstructorAvailableAt(instrId, dayIndex, period));
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
                                length: 1
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
    return rst;
}
exports.convert3 = convert3;
//ファイルを全削除する関数
function deleteALL() {
    try {
        // TimeTables.jsonを読み込む
        const data = fs.readFileSync(listFile, 'utf8');
        const jsonData = JSON.parse(data);
        // TimeTables.json内の各ファイルを削除
        for (const timeTable of jsonData.TimeTables) {
            const filePath = timeTable.file;
            // ファイルが存在する場合に削除
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Deleted file: ${filePath}`);
            }
            else {
                console.warn(`File does not exist: ${filePath}`);
            }
        }
    }
    catch (error) {
        console.error('Error deleting files:', error);
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
