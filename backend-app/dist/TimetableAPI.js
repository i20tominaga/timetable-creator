"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = void 0;
const fs_1 = __importDefault(require("fs"));
// ファイルからJSONデータを読み込む関数
const loadJSONFile = (filename) => {
    try {
        const data = fs_1.default.readFileSync(filename, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        console.error('JSONファイルの読み込みエラー:', error);
        return null;
    }
};
// JSONファイルにデータを書き込む関数
const writeJSONFile = (filename, data) => {
    fs_1.default.writeFileSync(filename, JSON.stringify(data, null, 2));
};
//時間割作成API
function create(req, res, course_file) {
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
}
exports.create = create;
