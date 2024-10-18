import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as courseAPI from './CourseAPI';
import * as timetableAPI from './TimetableAPI';
import * as jsonToCsv from './ConvertCSV';
import { time } from 'console';

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());
app.use(helmet());

//全教員取得API
app.get('/api/instructors/getAll', async (req: Request, res: Response) => {
    try {
        const instructorsData = await timetableAPI.loadInstructors();
        res.json(instructorsData);
    } catch (error) {
        console.error('Error fetching all instructors:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});

//全教室取得API
app.get('/api/rooms/getAll', async (req: Request, res: Response) => {
    try {
        const roomsData = await timetableAPI.loadRooms();
        res.json(roomsData);
    } catch (error) {
        console.error('Error fetching all rooms:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});


// 全授業取得API
app.get('/api/courses/getAll', async (req: Request, res: Response) => {
    try {
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
    } catch (error) {
        console.error('Error fetching all courses:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});

// 特定の授業取得API
app.get('/api/courses/get/:courseName', async (req: Request, res: Response) => {
    try {
        const courseName = req.params.courseName;
        const coursesData = await courseAPI.load();
        const courseData = coursesData.Courses.find((course: any) => course.name === courseName);

        if (courseData) {
            res.json(courseData);
        } else {
            res.status(404).send('Course not found');
        }
    } catch (error) {
        console.error('Error fetching course by name:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});

// 授業作成API
app.post('/api/courses/create', async (req: Request, res: Response) => {
    try {
        const coursesData = req.body;
        const existingCoursesData = await courseAPI.load();
        const newCourses = coursesData.map((newCourse: any) => ({
            name: newCourse.name,
            instructors: newCourse.instructors,
            rooms: newCourse.rooms,
            periods: newCourse.periods.map((period: any) => ({
                day: period.day,
                period: period.period
            }))
        }));

        existingCoursesData.Courses.push(...newCourses);

        await courseAPI.write(existingCoursesData);

        res.status(201).json({ message: '授業が作成されました。' });
    } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});

// 授業更新API
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
        console.error('Error updating course:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});

// 特定の授業削除API
app.delete('/api/courses/delete/:courseName', async (req: Request, res: Response) => {
    try {
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
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});

// 全授業削除API
app.delete('/api/courses/deleteAll', async (req: Request, res: Response) => {
    try {
        const coursesData = { Courses: [] };
        await courseAPI.write(coursesData);
        res.json({ message: '全ての授業が削除されました。' });
    } catch (error) {
        console.error('Error deleting all courses:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});

//時間割作成API
app.post('/api/timetable/create/:id', async (req, res) => {
    try {
        const id = decodeURIComponent(req.params.id);  // 日本語など特殊文字をデコード
        console.log(`Creating timetable with ID: ${id}`);

        const coursesData = await timetableAPI.loadCourses(); //授業データを取得
        const instructorData = await timetableAPI.loadInstructors(); //教員データを取得
        const roomData = await timetableAPI.loadRooms(); //教室データを取得

        // データを出力形式に変換し、idを追加
        const convertedData = timetableAPI.convert3(coursesData, instructorData, roomData);
        const newTimetable = {
            id,  // テキストエリアから受け取ったidを追加
            ...convertedData
        };

        // write関数を利用してデータを書き込む
        await timetableAPI.write(newTimetable, id);

        res.status(201).json(newTimetable);  // 新しい時間割を返す
    } catch (error) {
        console.error('Error creating timetable:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});

//全時間割削除API
app.delete('/api/timetable/deleteAll', async (req: Request, res: Response) => {
    try {
        timetableAPI.deleteALL();
        await timetableAPI.writeList([]);
        res.json({ message: '全ての時間割が削除されました。' });
    } catch (error) {
        console.error('Error deleting all timetables:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});
app.delete('/api/timetable/delete/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const data = await timetableAPI.loadList(); // 既存のタイムテーブルをロード
        if (Array.isArray(data.TimeTables)) {
            const timetableData = data.TimeTables.find((timetable: { id: string }) => timetable.id === id);
            if (!timetableData) {
                res.status(404).send('Timetable not found');
            } else {
                timetableAPI.deleteFile(timetableData.name); // タイムテーブルのファイルを削除
                const filteredData = data.TimeTables.filter((timetable: { id: string }) => timetable.id !== id);
                await timetableAPI.writeList({ TimeTables: filteredData }); // 更新されたリストを書き込む
                res.json({ message: '時間割が削除されました。' });
            }
        } else {
            res.status(500).send('Invalid data format');
        }
    } catch (error) {
        console.error('Error deleting timetable:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});

// 特定の時間割の詳細を取得するAPI
app.get('/api/timetable/get/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id;  // idを取得
        const data = await timetableAPI.loadList();
        if (Array.isArray(data.TimeTables)) {
            const timetableData = data.TimeTables.find((timetable: { id: string; }) => timetable.id === id);
            console.log('Timetable found:', timetableData);  // タイムテーブルが見つかったか確認
            if (!timetableData) {
                res.status(404).send('Timetable not found');
            } else {
                const rst = await timetableAPI.loadDetail(timetableData.file);
                res.json(rst);
            }
        } else {
            res.status(500).send('Invalid data format');
        }
    } catch (error) {
        console.error('時間割表の取得中にエラーが発生しました:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});

//時間割をCSVに変換するAPI
app.get('/api/timetable/convertCSV/:timetableName', async (req: Request, res: Response) => {
    try {
        const name = req.params.timetableName;
        jsonToCsv.convert(name);
        res.json({ message: '時間割がCSV形式に変換されました。' });
    } catch (error) {
        console.error('Error converting timetable to CSV:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});

//全時間割取得API
app.get('/api/timetable/getAll', async (req: Request, res: Response) => {
    try {
        const timetables = await timetableAPI.loadList();
        res.json(timetables);
    } catch (error) {
        console.error('Error fetching all timetables:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});

//時間割名の編集API
app.put('/api/timetable/update/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const newName = req.body.name;
        const data = await timetableAPI.loadList();
        if (Array.isArray(data.TimeTables)) {
            const timetableData = data.TimeTables.find((timetable: { id: string; }) => timetable.id === id);
            if (!timetableData) {
                res.status(404).send('Timetable not found');
            } else {
                timetableData.id = newName;
                await timetableAPI.writeList(data);
                res.json({ message: '時間割名が更新されました。' });
            }
        } else {
            res.status(500).send('Invalid data format');
        }
    } catch (error) {
        console.error('Error updating timetable name:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
