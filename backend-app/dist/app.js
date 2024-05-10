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
const app = (0, express_1.default)();
const port = 3000;
// ExpressのミドルウェアとしてJSONパースを使用する
app.use(express_1.default.json());
// 全授業取得API
app.get('/api/courses/getAll', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
}));
//特定の授業取得API
app.get('/api/courses/get/:courseName', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const courseName = req.params.courseName;
    const coursesData = yield courseAPI.load();
    const courseData = coursesData.Courses.find((course) => course.name === courseName);
    if (courseData) {
        res.json(courseData);
    }
    else {
        res.status(404).send('Course not found');
    }
}));
// 授業作成API
app.post('/api/courses/create', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // リクエストボディから授業データの配列を取得
        const coursesData = req.body;
        // JSONファイルから既存のデータを読み込む
        const existingCoursesData = yield courseAPI.load();
        // 新しい授業データを追加
        const newCourses = coursesData.map((newCourse) => ({
            name: newCourse.name,
            instructors: newCourse.instructors,
            rooms: newCourse.rooms,
            periods: newCourse.periods.map((period) => ({
                day: period.day,
                period: period.period
            }))
        }));
        // 既存のデータに新しい授業データを結合
        existingCoursesData.Courses.push(...newCourses);
        // 更新されたデータをJSONファイルに書き込む
        yield courseAPI.write(existingCoursesData);
        res.status(201).json({ message: '授業が作成されました。' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
}));
//授業更新API
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
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
}));
//特定の授業削除API
app.delete('/api/courses/delete/:courseName', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
}));
//全授業削除API
app.delete('/api/courses/deleteAll', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const coursesData = { Courses: [] };
    yield courseAPI.write(coursesData);
    res.json({ message: '全ての授業が削除されました。' });
}));
// 時間割作成API
app.post('/api/timetable/create', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // JSONファイルからデータを読み込む
        const coursesData = yield timetableAPI.loadCourses();
        const instructorsData = yield timetableAPI.loadTeachers();
        // 出力形式に変換する
        const timetableData = { Courses: coursesData, Instructors: instructorsData };
        const outputData = timetableAPI.convert(timetableData);
        // ファイルに書き込む
        yield timetableAPI.write(outputData);
        res.status(201).json({ message: '時間割が作成されました。' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
}));
// サーバーを起動
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
