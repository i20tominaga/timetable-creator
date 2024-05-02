"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const app = (0, express_1.default)();
const port = 3000;
const course_file = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/TestData/Test_Courses.json'; // JSONファイルのパス
const instructor_file = '../../TestData/Test_Instructor.json'; // JSONファイルのパス
// ファイルからJSONデータを読み込む関数
const loadJSONFile = (filename) => {
    const data = fs_1.default.readFileSync(course_file, 'utf-8');
    return JSON.parse(data);
};
// JSONファイルにデータを書き込む関数
const writeJSONFile = (filename, data) => {
    fs_1.default.writeFileSync(filename, JSON.stringify(data, null, 2));
};
// ExpressのミドルウェアとしてJSONパースを使用する
app.use(express_1.default.json());
// 全授業取得API
app.get('/api/courses/getAll', (req, res) => {
    const coursesData = loadJSONFile(course_file);
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
});
//特定の授業取得API
app.get('/api/courses/get/:courseName', (req, res) => {
    const courseName = req.params.courseName;
    const coursesData = loadJSONFile(course_file);
    const courseData = coursesData.Courses.find((course) => course.name === courseName);
    if (courseData) {
        res.json(courseData);
    }
    else {
        res.status(404).send('Course not found');
    }
});
// 授業作成API
app.post('/api/courses/create', (req, res) => {
    try {
        // リクエストボディから授業データの配列を取得
        const coursesData = req.body;
        // JSONファイルから既存のデータを読み込む
        const existingCoursesData = loadJSONFile(course_file);
        // 新しい授業データを追加
        const newCourses = coursesData.map((newCourse) => ({
            name: newCourse.name,
            instructors: newCourse.instructors,
            rooms: newCourse.rooms,
            periods: newCourse.periods
        }));
        // 既存のデータに新しい授業データを結合
        existingCoursesData.Courses.push(...newCourses);
        // 更新されたデータをJSONファイルに書き込む
        writeJSONFile(course_file, existingCoursesData);
        res.status(201).json({ message: '授業が作成されました。' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});
//授業更新API
app.put('/api/courses/update/:courseName', (req, res) => {
    try {
        const courseName = req.params.courseName;
        const { instructors, rooms, periods } = req.body;
        const coursesData = loadJSONFile(course_file);
        const courseIndex = coursesData.Courses.findIndex((course) => course.name === courseName);
        if (courseIndex !== -1) {
            coursesData.Courses[courseIndex].instructors = instructors;
            coursesData.Courses[courseIndex].rooms = rooms;
            coursesData.Courses[courseIndex].periods = periods;
            writeJSONFile(course_file, coursesData);
            res.json({ message: '授業が更新されました。' });
        }
        else {
            res.status(404).send('Course not found');
        }
    }
    catch (error) {
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});
//特定の授業削除API
app.delete('/api/courses/delete/:courseName', (req, res) => {
    const courseName = req.params.courseName;
    const coursesData = loadJSONFile(course_file);
    const filteredCourses = coursesData.Courses.filter((course) => course.name !== courseName);
    if (filteredCourses.length < coursesData.Courses.length) {
        coursesData.Courses = filteredCourses;
        writeJSONFile(course_file, coursesData);
        res.json({ message: '授業が削除されました。' });
    }
    else {
        res.status(404).send('Course not found');
    }
});
//全授業削除API
app.delete('/api/courses/deleteAll', (req, res) => {
    const coursesData = { Courses: [] };
    writeJSONFile(course_file, coursesData);
    res.json({ message: '全ての授業が削除されました。' });
});
// サーバーを起動
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
