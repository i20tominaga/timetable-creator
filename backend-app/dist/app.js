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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const courseAPI = __importStar(require("./CourseAPI"));
const timetableAPI = __importStar(require("./TimetableAPI"));
const jsonToCsv = __importStar(require("./ConvertCSV"));
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.json());
// 全授業取得API
app.get('/api/courses/getAll', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const coursesData = yield courseAPI.load();
        const courseData = coursesData.Courses.map((course) => ({
            name: course.name,
            instructors: course.instructors,
            rooms: course.rooms,
            periods: course.periods.map((period) => ({
                day: period.day,
                period: period.period
            }))
        }));
        res.json(courseData);
    }
    catch (error) {
        console.error('Error fetching all courses:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
}));
// 特定の授業取得API
app.get('/api/courses/get/:courseName', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courseName = req.params.courseName;
        const coursesData = yield courseAPI.load();
        const courseData = coursesData.Courses.find((course) => course.name === courseName);
        if (courseData) {
            res.json(courseData);
        }
        else {
            res.status(404).send('Course not found');
        }
    }
    catch (error) {
        console.error('Error fetching course by name:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
}));
// 授業作成API
app.post('/api/courses/create', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const coursesData = req.body;
        const existingCoursesData = yield courseAPI.load();
        const newCourses = coursesData.map((newCourse) => ({
            name: newCourse.name,
            instructors: newCourse.instructors,
            rooms: newCourse.rooms,
            periods: newCourse.periods.map((period) => ({
                day: period.day,
                period: period.period
            }))
        }));
        existingCoursesData.Courses.push(...newCourses);
        yield courseAPI.write(existingCoursesData);
        res.status(201).json({ message: '授業が作成されました。' });
    }
    catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
}));
// 授業更新API
app.put('/api/courses/update/:courseName', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courseName = req.params.courseName;
        const { instructors, rooms, periods } = req.body;
        const coursesData = yield courseAPI.load();
        const courseIndex = coursesData.Courses.findIndex((course) => course.name === courseName);
        if (courseIndex !== -1) {
            coursesData.Courses[courseIndex].instructors = instructors;
            coursesData.Courses[courseIndex].rooms = rooms;
            coursesData.Courses[courseIndex].periods = periods;
            yield courseAPI.write(coursesData);
            res.json({ message: '授業が更新されました。' });
        }
        else {
            res.status(404).send('Course not found');
        }
    }
    catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
}));
// 特定の授業削除API
app.delete('/api/courses/delete/:courseName', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courseName = req.params.courseName;
        const coursesData = yield courseAPI.load();
        const filteredCourses = coursesData.Courses.filter((course) => course.name !== courseName);
        if (filteredCourses.length < coursesData.Courses.length) {
            coursesData.Courses = filteredCourses;
            yield courseAPI.write(coursesData);
            res.json({ message: '授業が削除されました。' });
        }
        else {
            res.status(404).send('Course not found');
        }
    }
    catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
}));
// 全授業削除API
app.delete('/api/courses/deleteAll', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const coursesData = { Courses: [] };
        yield courseAPI.write(coursesData);
        res.json({ message: '全ての授業が削除されました。' });
    }
    catch (error) {
        console.error('Error deleting all courses:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
}));
// 時間割作成API
app.post('/api/timetable/create', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const startTime = Date.now();
        const coursesData = yield timetableAPI.loadCourses(); //授業データを取得
        const instructorData = yield timetableAPI.loadInstructors(); //教員データを取得
        const roomData = yield timetableAPI.loadRooms(); //教室データを取得
        const convertedData = timetableAPI.convert2(coursesData, instructorData, roomData); //データを出力形式に変換
        yield timetableAPI.write(convertedData); // write関数を利用してデータを書き込む
        // レスポンスを返す
        res.status(201).json(convertedData);
        const endTime = Date.now();
        console.log(`Time taken: ${endTime - startTime}ms`);
    }
    catch (error) {
        console.error('Error creating timetable:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
}));
//全時間割削除API
app.delete('/api/timetable/deleteAll', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield timetableAPI.writeList([]);
        res.json({ message: '全ての時間割が削除されました。' });
    }
    catch (error) {
        console.error('Error deleting all timetables:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
}));
//時間割削除API
app.delete('/api/timetable/delete/:timetableName', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const name = req.params.timetableName;
        const data = yield timetableAPI.loadList();
        if (Array.isArray(data)) {
            const timetableData = data.find((timetable) => timetable.name === name);
            if (!timetableData) {
                res.status(404).send('Timetable not found');
            }
            else {
                const filteredData = data.filter((timetable) => timetable.name !== name);
                yield timetableAPI.writeList(filteredData);
                res.json({ message: '時間割が削除されました。' });
            }
        }
    }
    catch (error) {
        console.error('Error deleting timetable:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
}));
// 特定の時間割の詳細を取得するAPI
app.get('/api/timetable/get/:timetableName', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const name = req.params.timetableName;
        const data = yield timetableAPI.loadList();
        if (Array.isArray(data)) {
            const timetableData = data.find((timetable) => timetable.name === name);
            console.log(timetableData);
            if (!timetableData) {
                res.status(404).send('Timetable not found');
            }
            else {
                const rst = yield timetableAPI.loadDetail(timetableData.file);
                res.json(rst);
            }
        }
    }
    catch (error) {
        console.error('時間割表の取得中にエラーが発生しました:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
}));
//時間割をCSVに変換するAPI
app.get('/api/timetable/convertCSV', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        jsonToCsv.convert();
        res.json({ message: '時間割がCSV形式に変換されました。' });
    }
    catch (error) {
        console.error('Error converting timetable to CSV:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
}));
//全時間割取得API
app.get('/api/timetable/getAll', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const timetables = yield timetableAPI.loadList();
        res.json(timetables);
    }
    catch (error) {
        console.error('Error fetching all timetables:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
}));
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
