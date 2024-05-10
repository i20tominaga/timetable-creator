import express, { Request, Response } from 'express';
import * as courseAPI from './CourseAPI';

const app = express();
const port = 3000;

// ExpressのミドルウェアとしてJSONパースを使用する
app.use(express.json());

// 全授業取得API
app.get('/api/courses/getAll', async (req: Request, res: Response) => {
    const coursesData = await courseAPI.load();
    const courseData = coursesData.Courses.map((course: any) => ({
        name: course.name,
        instructors: course.instructors,
        rooms: course.rooms,
        periods: course.periods.map((period: any) => ({
            day: period.day,
            period: period.period
        }))
    }));

    res.json(courseData);
});

//特定の授業取得API
app.get('/api/courses/get/:courseName', async (req: Request, res: Response) => {
    const courseName = req.params.courseName;
    const coursesData = await courseAPI.load();
    const courseData = coursesData.Courses.find((course: any) => course.name === courseName);

    if (courseData) {
        res.json(courseData);
    } else {
        res.status(404).send('Course not found');
    }
});

// 授業作成API
app.post('/api/courses/create', async (req: Request, res: Response) => {
    try {
        // リクエストボディから授業データの配列を取得
        const coursesData = req.body;
        // JSONファイルから既存のデータを読み込む
        const existingCoursesData = await courseAPI.load();
        // 新しい授業データを追加
        const newCourses = coursesData.map((newCourse: any) => ({
            name: newCourse.name,
            instructors: newCourse.instructors,
            rooms: newCourse.rooms,
            periods: newCourse.periods.map((period: any) => ({
                day: period.day,
                period: period.period
            }))
        }));

        // 既存のデータに新しい授業データを結合
        existingCoursesData.Courses.push(...newCourses);

        // 更新されたデータをJSONファイルに書き込む
        await courseAPI.write(existingCoursesData);

        res.status(201).json({ message: '授業が作成されました。' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});

//授業更新API
app.put('/api/courses/update/:courseName', async (req: Request, res: Response) => {
    try {
        const courseName = req.params.courseName;
        const { instructors, rooms, periods } = req.body;
        const coursesData = await courseAPI.load();
        const courseIndex = coursesData.Courses.findIndex((course: any) => course.name === courseName);

        if (courseIndex !== -1) {
            coursesData.Courses[courseIndex].instructors = instructors;
            coursesData.Courses[courseIndex].rooms = rooms;
            coursesData.Courses[courseIndex].periods = periods;

            await courseAPI.write(coursesData);

            res.json({ message: '授業が更新されました。' });
        } else {
            res.status(404).send('Course not found');
        }
    } catch (error) {
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});

//特定の授業削除API
app.delete('/api/courses/delete/:courseName', async (req: Request, res: Response) => {
    const courseName = req.params.courseName;
    const coursesData = await courseAPI.load();
    const filteredCourses = coursesData.Courses.filter((course: any) => course.name !== courseName);

    if (filteredCourses.length < coursesData.Courses.length) {
        coursesData.Courses = filteredCourses;
        await courseAPI.write(coursesData);
        res.json({ message: '授業が削除されました。' });
    } else {
        res.status(404).send('Course not found');
    }
});

//全授業削除API
app.delete('/api/courses/deleteAll', async (req: Request, res: Response) => {
    const coursesData = { Courses: [] };
    await courseAPI.write(coursesData);
    res.json({ message: '全ての授業が削除されました。' });
});

//時間割作成API
app.post('/api/timetable/create', async (req: Request, res: Response) => {

});


// サーバーを起動
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});