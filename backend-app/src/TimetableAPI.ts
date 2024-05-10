import { Request, Response } from 'express';
import fs from 'fs';

// ファイルからJSONデータを読み込む関数
const loadJSONFile = (filename: string) => {
    try {
        const data = fs.readFileSync(filename, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('JSONファイルの読み込みエラー:', error);
        return null;
    }
};

// JSONファイルにデータを書き込む関数
const writeJSONFile = (filename: string, data: any) => {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
};

//時間割作成API
export function create(req: Request, res: Response, course_file: string) {
    try {
        // リクエストボディから授業データの配列を取得
        const coursesData = req.body;
        // JSONファイルから既存のデータを読み込む
        const existingCoursesData = loadJSONFile(course_file);
        // 新しい授業データを追加
        const newCourses = coursesData.map((newCourse: any) => ({
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
}