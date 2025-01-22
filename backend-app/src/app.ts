import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import axios from 'axios';
import * as courseAPI from './api/Course';
import * as roomAPI from './api/Room';
import * as instructorAPI from './api/Instructor';
import * as timetableAPI from './api/Timetable';
import * as jsonToCsv from './utils/ConvertCSV';
import authRoutes from './routes/authRoutes';
import { getCurrentDayAndPeriod } from './utils/timeUtils';
import {
    Room,
    RoomJson,
    ManualOverride,
    TimeRange,
    Period,
    Timetable,
    ExportJson
} from './types/types';

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use('/api/auth', authRoutes);

//全教室取得API
app.get('/api/rooms/getAll', async (req: Request, res: Response) => {
    try {
        const roomsData = await roomAPI.loadRooms();
        const roomData = roomsData.Room.map((room: any) => ({
            name: room.name,
            unavailable: room.unavailable,
            manualOverride: room.manualOverride
        }));
        res.json(roomData);
    } catch (error) {
        console.error('Error fetching all rooms:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});

//教室作成API
app.post('/api/rooms/create', async (req: Request, res: Response) => {
    try {
        const roomsData = req.body;

        if (!Array.isArray(roomsData)) {
            return res.status(400).json({ message: '送信されたデータが配列ではありません。' });
        }

        const existingRoomsData = await roomAPI.loadRooms();
        if (!existingRoomsData.Room) {
            existingRoomsData.Room = [];
        }

        const newRooms = roomsData.map((newRoom: any) => ({
            name: newRoom.name,
            unavailable: newRoom.unavailable,
            manualOverride: newRoom.manualOverride
        }));

        existingRoomsData.Room.push(...newRooms);
        await roomAPI.writeRooms(existingRoomsData);

        res.status(201).json(newRooms[0]);
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});

//教室更新API
app.put('/api/rooms/update/:roomName', async (req: Request, res: Response) => {
    try {
        const roomName = req.params.roomName;
        const { unavailable } = req.body;
        console.log("Request body:", req.body); // デバッグ用: リクエストボディの内容を表示

        const roomsData = await roomAPI.loadRooms();
        const roomIndex = roomsData.Room.findIndex((room: any) => room.name === roomName);

        if (roomIndex !== -1) {
            // データが存在する場合のみ更新
            roomsData.Room[roomIndex] = {
                name: roomName,
                unavailable: unavailable || roomsData.Room[roomIndex].unavailable,
                manualOverride: roomsData.Room[roomIndex].manualOverride
            };

            await roomAPI.writeRooms(roomsData);

            res.json({ updatedRoom: roomsData.Room[roomIndex] });
        } else {
            res.status(404).send('Room not found');
        }
    } catch (error) {
        console.error('Error updating room:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});

//特定の教室削除API
app.delete('/api/rooms/delete/:roomName', async (req: Request, res: Response) => {
    try {
        const roomName = req.params.roomName;
        const roomsData = await roomAPI.loadRooms();
        const filteredRooms = roomsData.Room.filter((room: any) => room.name !== roomName);

        if (filteredRooms.length < roomsData.Room.length) {
            roomsData.Room = filteredRooms;
            await roomAPI.writeRooms(roomsData);
            res.status(200).json({ message: '教室が削除されました。' });
        } else {
            res.status(404).json({ message: '指定された教室が見つかりません。' });
        }
    } catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});

//全教室削除API
app.delete('/api/rooms/deleteAll', async (req: Request, res: Response) => {
    try {
        const roomsData = { Room: [] };
        await roomAPI.writeRooms(roomsData);
        res.json({ message: '全ての教室が削除されました。' });
    } catch (error) {
        console.error('Error deleting all rooms:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});

//　手動設定API
app.post('/api/rooms/set-manual/:roomName', async (req: Request, res: Response) => {
    try {
        const roomName = req.params.roomName;
        const { isManual, reason, setBy, start, end }: ManualOverride & TimeRange = req.body;

        // バリデーション
        if (
            typeof isManual !== 'boolean' ||
            !reason ||
            typeof reason !== 'string' ||
            !setBy ||
            typeof setBy !== 'string' ||
            typeof start !== 'number' ||
            typeof end !== 'number'
        ) {
            return res.status(400).json({ message: '無効なデータです。' });
        }

        if (start >= end) {
            return res.status(400).json({ message: '開始時刻は終了時刻より前でなければなりません。' });
        }

        // 教室データの取得
        const roomsData: RoomJson = await roomAPI.loadRooms();
        const roomIndex = roomsData.Room.findIndex((room: Room) => room.name === roomName);

        if (roomIndex === -1) {
            return res.status(404).json({ message: `教室 '${roomName}' が見つかりません。` });
        }

        const room = roomsData.Room[roomIndex];

        // manualOverride の更新
        if (isManual) {
            room.manualOverride = { isManual, reason, setBy };
            room.unavailable.push({ start, end }); // UNIXタイムスタンプ範囲を unavailable に追加
        } else {
            room.manualOverride = { isManual: false, reason: '', setBy: '' };
        }

        // 教室データを書き込み
        await roomAPI.writeRooms(roomsData);

        res.json({ message: `教室 '${roomName}' が手動設定されました。` });
    } catch (error) {
        console.error('Error updating manual override:', error);
        res.status(500).json({ message: 'サーバーエラーが発生しました。' });
    }
});

// 教室の使用範囲をクリーンアップするAPI
app.post('/api/rooms/occupied', async (req: Request, res: Response) => {
    try {
        const { timetableId } = req.body;

        if (!timetableId) {
            return res.status(400).json({ message: 'タイムテーブルIDが指定されていません。' });
        }

        // 時間割リストをロードして、指定されたIDに一致する時間割を取得
        const data = await timetableAPI.loadList();
        if (!Array.isArray(data.TimeTables)) {
            return res.status(500).json({ message: 'Invalid data format' });
        }

        const timetableEntry = data.TimeTables.find((timetable: { id: string }) => timetable.id === timetableId);
        if (!timetableEntry) {
            return res.status(404).json({ message: '指定された時間割が見つかりません。' });
        }

        // 時間割の詳細をロード
        const timetableData: ExportJson = await timetableAPI.loadDetail(timetableEntry.file);
        if (!timetableData) {
            return res.status(404).json({ message: '時間割データが見つかりません。' });
        }

        // 現在の曜日と時限を取得
        const { day, period } = roomAPI.getCurrentDayAndPeriod();
        if (period === null) {
            return res.json({ occupiedRooms: [], isBreakTime: true });
        }

        // 現在の曜日に対応するデータを取得
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDayString = daysOfWeek[day];

        const dayData = timetableData.Days.find((d) => d.Day === currentDayString);
        if (!dayData) {
            return res.json({ occupiedRooms: [], isBreakTime: true });
        }

        // 現在時限に該当する授業を抽出
        const currentClasses = dayData.Classes.filter((cls) => cls.periods.period === period);

        // 使用中の教室を取得
        const occupiedRooms = currentClasses
            .flatMap((cls) => cls.Rooms || [])
            .filter((room, index, self) => self.indexOf(room) === index); // 重複排除

        res.json({
            occupiedRooms,
            isBreakTime: occupiedRooms.length === 0,
        });
    } catch (error) {
        console.error('教室の使用状態取得中にエラーが発生しました:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});

//空き教室取得API
app.post('/api/rooms/available', async (req: Request, res: Response) => {
    try {
        const { timetableId } = req.body;

        if (!timetableId) {
            return res.status(400).json({ message: 'タイムテーブルIDが指定されていません。' });
        }

        const allRoomsData: RoomJson = await roomAPI.loadRooms(); // 全教室データをロード
        const allRooms = allRoomsData.Room.map((room) => room.name);

        // 使用中の教室を取得
        const occupiedResponse = await axios.post('http://localhost:3001/api/rooms/occupied', { timetableId });
        const occupiedRooms = occupiedResponse.data.occupiedRooms || [];

        // 空いている教室を計算
        const availableRooms = allRooms.filter((room) => !occupiedRooms.includes(room));

        res.json({
            availableRooms,
            isBreakTime: occupiedResponse.data.isBreakTime,
        });
    } catch (error) {
        console.error('空き教室の取得中にエラーが発生しました:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});

app.post('/api/rooms/occupied', async (req: Request, res: Response) => {
    try {
        const { timetableId } = req.body;

        if (!timetableId) {
            return res.status(400).json({ message: 'タイムテーブルIDが指定されていません。' });
        }

        const timetableData: ExportJson = await timetableAPI.loadDetail(timetableId);
        if (!timetableData) {
            return res.status(404).json({ message: '指定された時間割が見つかりません。' });
        }

        const { day, period } = getCurrentDayAndPeriod();
        if (period === null) {
            return res.json({ occupied: false });
        }

        // 数値の曜日を文字列の曜日に変換
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDayString = daysOfWeek[day]; // 例: 0 → 'Sunday'

        const dayData = timetableData.Days.find((d) => d.Day === currentDayString);

        if (!dayData) {
            return res.status(404).json({ message: '指定された曜日のデータが見つかりません。' });
        }

        const currentClasses = dayData.Classes.filter((cls) => cls.periods.period === period);

        const occupiedRooms = currentClasses
            .flatMap((cls) => cls.Rooms || [])
            .filter((room, index, self) => self.indexOf(room) === index); // 重複排除

        res.json({
            occupiedRooms,
            isBreakTime: occupiedRooms.length === 0,
        });
    } catch (error) {
        console.error("Error fetching occupied rooms:", error);
        res.status(500).json({ message: 'サーバーエラーが発生しました。' });
    }
});

//全教員削除API
app.delete('/api/instructors/deleteAll', async (req: Request, res: Response) => {
    try {
        const instructorsData = { Instructor: [] };
        await instructorAPI.writeInstructors(instructorsData);
        res.json({ message: '全ての教員が削除されました。' });
    } catch (error) {
        console.error('Error deleting all instructors:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});

//全教員取得API
app.get('/api/instructors/getAll', async (req: Request, res: Response) => {
    try {
        const instructorsData = await instructorAPI.loadInstructors();
        const instructorData = instructorsData.Instructor.map((instructor: any) => ({
            id: instructor.id,
            name: instructor.name,
            isFullTime: instructor.isFullTime,
            periods: instructor.periods
        }));
        res.json(instructorData);

    } catch (error) {
        console.error('Error fetching all instructors:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});

//教員作成API
app.post('/api/instructors/create', async (req: Request, res: Response) => {
    try {
        const instructorsData = req.body;

        if (!Array.isArray(instructorsData)) {
            return res.status(400).json({ message: '送信されたデータが配列ではありません。' });
        }

        // 既存の教員データを取得
        const existingInstructorsData = await instructorAPI.loadInstructors();

        // Instructorプロパティが無い場合は空配列で初期化
        if (!existingInstructorsData.Instructor) {
            existingInstructorsData.Instructor = [];
        }

        // 新しい教員データをマッピング
        const newInstructors = instructorsData.map((newInstructor: any) => ({
            id: newInstructor.id,
            name: newInstructor.name,
            isFullTime: newInstructor.isFullTime,
            periods: newInstructor.periods
        }));

        // 重複確認しながら追加
        newInstructors.forEach((newInstructor) => {
            if (!existingInstructorsData.Instructor.some((instructor) => instructor.id === newInstructor.id)) {
                existingInstructorsData.Instructor.push(newInstructor);
            }
        });

        // 既存データに新規データを含めて書き込み
        await instructorAPI.writeInstructors(existingInstructorsData);

        res.status(201).json({ addedInstructors: newInstructors });
    } catch (error) {
        console.error('Error creating instructor:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});

//教員更新API
app.put('/api/instructors/update/:instructorId', async (req: Request, res: Response) => {
    try {
        const instructorId = req.params.instructorId;
        const { name, isFullTime, periods } = req.body;
        console.log("Request body:", req.body); // デバッグ用: リクエストボディの内容を表示

        const instructorsData = await instructorAPI.loadInstructors();
        const instructorIndex = instructorsData.Instructor.findIndex((instructor: any) => instructor.id === instructorId);

        if (instructorIndex !== -1) {
            // データが存在する場合のみ更新
            instructorsData.Instructor[instructorIndex] = {
                id: instructorId,
                name: name || instructorsData.Instructor[instructorIndex].name,  // nameが指定されていれば更新、なければ既存データ
                isFullTime: isFullTime || instructorsData.Instructor[instructorIndex].isFullTime,
                periods: periods || instructorsData.Instructor[instructorIndex].periods
            };

            await instructorAPI.writeInstructors(instructorsData);

            res.json({
                updatedInstructor: instructorsData.Instructor[instructorIndex],
                message: '教員が更新されました。'
            });
        } else {
            res.status(404).send('Instructor not found');
        }
    } catch (error) {
        console.error('Error updating instructor:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});

// 特定の教員削除API
app.delete('/api/instructors/delete/:instructorId', async (req: Request, res: Response) => {
    try {
        const instructorId = req.params.instructorId;
        const instructorsData = await instructorAPI.loadInstructors();
        const filteredInstructors = instructorsData.Instructor.filter((instructor: any) => instructor.id !== instructorId);

        if (filteredInstructors.length < instructorsData.Instructor.length) {
            // 削除された場合、更新してレスポンスを返す
            instructorsData.Instructor = filteredInstructors;
            await instructorAPI.writeInstructors(instructorsData);
            res.status(200).json({ message: '教員が削除されました。' });
        } else {
            // 教員が見つからない場合
            res.status(404).json({ message: '指定された教員が見つかりません。' });
        }
    } catch (error) {
        console.error('Error deleting instructor:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});

// 全授業取得API
app.get('/api/courses/getAll', async (req: Request, res: Response) => {
    try {
        const coursesData = await courseAPI.load();
        if (!coursesData || !coursesData.Courses) {
            res.status(500).json({ message: 'コースデータの取得に失敗しました。' });
            return;
        }

        if (!Array.isArray(coursesData.Courses)) {
            res.status(400).json({ message: 'Invalid courses data format' });
            return;
        }

        const courseData = coursesData.Courses.map((course: any) => ({
            name: course.name,
            instructors: course.instructors,
            rooms: course.rooms,
            targets: course.targets,
            periods: Array.isArray(course.periods) ? course.periods.map((period: any) => ({
                day: period.day,
                period: period.period
            })) : [], // periodsが配列でなければ空配列を返す
            length: course.length
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

        // 配列でなければエラーを返す
        if (!Array.isArray(coursesData)) {
            return res.status(400).json({ message: '送信されたデータが配列ではありません。' });
        }

        const existingCoursesData = await courseAPI.load();
        if (!existingCoursesData.Courses) {
            existingCoursesData.Courses = [];
        }
        const newCourses = coursesData.map((newCourse: any) => ({
            name: newCourse.name,
            instructors: newCourse.instructors,
            targets: newCourse.targets,
            rooms: newCourse.rooms,
            periods: newCourse.periods.map((period: any) => ({
                day: period.day,
                period: period.period
            })),
            length: newCourse.length
        }));

        existingCoursesData.Courses.push(...newCourses);
        await courseAPI.write(existingCoursesData);

        res.status(201).json(newCourses[0]); // 作成された1つ目の授業を返す
    } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});

// 授業更新API
app.put('/api/courses/update/:courseName', async (req: Request, res: Response) => {
    try {
        const courseName = req.params.courseName;
        const { instructors, rooms, periods, targets, name } = req.body;
        console.log("Request body:", req.body); // デバッグ用: リクエストボディの内容を表示

        const coursesData = await courseAPI.load();
        const courseIndex = coursesData.Courses.findIndex((course: any) => course.name === courseName);

        if (courseIndex !== -1) {
            // データが存在する場合のみ更新
            coursesData.Courses[courseIndex] = {
                name: name || coursesData.Courses[courseIndex].name,  // nameが指定されていれば更新、なければ既存データ
                instructors: instructors || coursesData.Courses[courseIndex].instructors,
                rooms: rooms || coursesData.Courses[courseIndex].rooms,
                periods: periods || coursesData.Courses[courseIndex].periods,
                targets: targets || coursesData.Courses[courseIndex].targets,
                length: length || coursesData.Courses[courseIndex].length
            };

            await courseAPI.write(coursesData);

            // 更新した授業データをレスポンスとして返す
            res.json({ updatedCourse: coursesData.Courses[courseIndex] });
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
        // クライアントから受け取った名前をデコードする
        const courseName = decodeURIComponent(req.params.courseName);

        const coursesData = await courseAPI.load();
        const filteredCourses = coursesData.Courses.filter((course: any) => course.name !== courseName);

        if (filteredCourses.length < coursesData.Courses.length) {
            // 削除された場合、更新してレスポンスを返す
            coursesData.Courses = filteredCourses;
            await courseAPI.write(coursesData);
            res.status(200).json({ message: '授業が削除されました。' });
        } else {
            // コースが見つからない場合
            res.status(404).json({ message: '指定された授業が見つかりません。' });
        }
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({ message: 'サーバーエラーが発生しました。' });
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
        const instructorData = await instructorAPI.loadInstructors(); //教員データを取得
        const roomData = await roomAPI.loadRooms(); //教室データを取得

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

//特定の時間割削除API
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

//現在時間から現在の曜日と時限を取得するAPI
app.get('/api/timetable/current-period', (req: Request, res: Response) => {
    try {
        const currentPeriodData = getCurrentDayAndPeriod();
        res.status(200).json(currentPeriodData);
    } catch (error) {
        console.error('Error fetching current period:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
});



app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
