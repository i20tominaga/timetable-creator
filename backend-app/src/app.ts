import express, { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import * as bodyParser from 'body-parser';
import fs from 'fs';

const serviceAccount = require('/Users/tominagaayumu/Downloads/秘密鍵/testdata-684fc-firebase-adminsdk-9vujs-cfd14231bd.json'); // Firebaseのサービスアカウントキーのパスを指定
const app = express();
const port = 3000;

// Firebase Admin SDKの初期化
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://console.firebase.google.com/project/testdata-684fc/firestore/databases/-default-/data/~2F?hl=ja' // FirebaseのデータベースURLを指定
});

const db = admin.firestore();

// Expressアプリケーションを設定
app.use(bodyParser.json());

// 授業取得エンドポイント
app.get('/api/courses/:id', async (req: Request, res: Response) => {
    try {
        const coursesRef = db.collection('courses');
        const snapshot = await coursesRef.get();
        const courses: any[] = [];
        snapshot.forEach((doc) => {
        courses.push({
            id: doc.id,
            data: doc.data()
        });
});

res.status(200).json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).send('Internal Server Error');
    }
});

// 授業作成APIエンドポイント
app.post('/api/courses/add', async (req, res) => {
    try {
        let newDataArray = [];
        if (Array.isArray(req.body)) {
            newDataArray = req.body;
        } else if (typeof req.body === 'object' && req.body !== null) {
            newDataArray = [req.body];
        } else {
            console.error('無効なリクエストボディです');
            return res.status(400).send('無効なリクエストボディです');
        }
        // データ配列内の各オブジェクトをFirestoreに追加
        const promises = newDataArray.map(async (newData) => {
            let docId;
            const { name, grade, department, departments, instructor, room } = newData;
            if (Array.isArray(departments) && departments.length > 0) {
                docId = `${name}${departments.length}学科${grade}`;
            } else if (typeof department === 'string' && department.trim() !== '') {
                docId = `${name}${department}${grade}`;
            } else {
                console.error('departmentまたはdepartmentsが適切に指定されていません');
                return null;
            }
            if (!docId) {
                console.error('ドキュメントIDを生成できませんでした:', newData);
                return null;
            }
            const docRef = db.collection('courses').doc(docId); // ドキュメントIDを指定してドキュメント参照を取得
            const docSnapshot = await docRef.get(); // ドキュメントの存在を確認
            if (docSnapshot.exists) {
                console.error('ドキュメントIDが重複しています:', docId);
                return null;
            }
            await docRef.set(newData);
            console.log('データがFirestoreに追加されました'); // データが追加されたことをログに出力
            return docId; // 追加したドキュメントのIDを返す
        });
        // 全てのデータ追加のPromiseを待機し、追加されたドキュメントIDを取得
        const docIds = await Promise.all(promises);
        // 追加されたドキュメントIDの配列をクライアントに返す
        res.status(200).json(docIds.filter(id => id !== null)); // nullを除外して返す
    } catch (error) {
        console.error('データの追加中にエラーが発生しました:', error);
        res.status(500).send('データの追加中にエラーが発生しました');
    }
});

// 授業更新エンドポイント
app.put('/api/courses/update/:id', async (req: Request, res: Response) => {
    try {
        const courseId = req.params.id;
        const newData = req.body; // 更新されたデータをリクエストボディから取得

        const docRef = db.collection('courses').doc(courseId);
        const doc = await docRef.get();
        if (doc.exists) {
            // ドキュメントが存在する場合は更新する
            await docRef.update(newData);
            console.log('データがFirestoreで更新されました'); // 更新メッセージを出力
            res.status(200).send('データが正常に更新されました');
        } else {
            res.status(404).send('Document not found');
        }
    } catch (error) {
        console.error('Error updating document:', error);
        res.status(500).send('Internal Server Error');
    }
});

// 全ての授業を削除するエンドポイント
app.delete('/api/courses/deleteAll', async (req: Request, res: Response) => {
    try {
        // 全ての授業を削除
        await db.collection('courses').get().then(snapshot => {
            snapshot.forEach(doc => {
                doc.ref.delete();
            });
        });
        console.log('全てのデータがFirestoreから削除されました'); // ログに削除メッセージを出力
        res.status(200).send('全てのデータが正常に削除されました');
    } catch (error) {
        console.error('Error deleting all documents:', error);
        res.status(500).send('Internal Server Error');
    }
});

// 特定の授業を削除するエンドポイント
app.delete('/api/courses/delete/:id', async (req: Request, res: Response) => {
    try {
        const courseId = req.params.id;
        const docRef = db.collection('courses').doc(courseId);
        const doc = await docRef.get();
        if (doc.exists) {
            // ドキュメントが存在する場合は削除する
            await docRef.delete();
            console.log('データがFirestoreから削除されました'); // ログに削除メッセージを出力
            res.status(200).send('データが正常に削除されました');
        } else {
            res.status(404).send('Document not found');
        }
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).send('Internal Server Error');
    }
});


// 時間割取得エンドポイント
app.get('/api/timetables', async (req: Request, res: Response) => {
  // 時間割の取得処理を実装する
});

// 時間割詳細取得エンドポイント
app.get('/api/timetables/detail/:id', async (req: Request, res: Response) => {
  // 時間割の詳細情報取得処理を実装する
});


//時間割作成APIエンドポイント
app.post('/api/timetables/create', async (req, res) => {
    try {
        const startTime = performance.now(); // 処理開始時刻を記録
        const coursesSnapshot = await db.collection('courses').get(); // Firebaseから授業データを全て取得
        if (coursesSnapshot.empty) {
            throw new Error('No courses found in Firestore');
        }

        const coursesData = coursesSnapshot.docs.map(doc => doc.data()); // 授業データを配列に変換

        // 曜日ごとのデータを整理
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const timetable: { [key: string]: any }[] = [];

        // 各曜日ごとに処理
        for (const day of daysOfWeek) {
            const dayData: { [key: string]: any } = {}; // 曜日ごとのデータを作成

            // 各学年ごとに処理
            const grades = ['1年', '2年', '3年', '4年', '5年', '専1', '専2'];
            for (const grade of grades) {
                const gradeData: { [key: string]: any } = {}; // 学年ごとのデータを作成

                // 各学科ごとに処理
                const classes = ['ME', 'IE', 'CA'];
                for (const cls of classes) {
                    const classData: { [key: string]: any } = {}; // クラスごとのデータを作成
                    const timeSlots = ['1,2限', '3,4限', '5,6限', '7,8限'];

                    // 各コマごとに処理
                    for (const slot of timeSlots) {
                        // ここで授業データをランダムに選択して格納する例
                        const randomCourse = coursesData[Math.floor(Math.random() * coursesData.length)];
                        if (randomCourse.department === cls) {
                            classData[slot] = { course: randomCourse }; // 授業データを格納
                        }
                    }
                    gradeData[cls] = classData; // クラスデータを学年データに追加
                }
                dayData[grade] = gradeData; // 学年データを曜日データに追加
            }
            timetable.push({ [day]: dayData }); // 曜日データを時間割に追加
        }

        const endTime = performance.now(); // 処理終了時刻を記録
        const executionTime = endTime - startTime; // 処理時間を計算
        console.log(`Execution time: ${executionTime}ms`); // 処理時間をログに出力

        // JSONファイルに出力
        fs.writeFileSync('Test.json', JSON.stringify(timetable, null, 2));

        res.status(200).json(timetable); // 完成した時間割データを返す
    } catch (error) {
        console.error('時間割の作成中にエラーが発生しました:', error);
        res.status(500).send('時間割の作成中にエラーが発生しました');
    }
});




// 時間割更新エンドポイント
app.put('/api/timetables/update/:id', async (req: Request, res: Response) => {
  // 時間割の更新処理を実装する
});

// 時間割削除エンドポイント
app.delete('/api/timetables/delete/:id', async (req: Request, res: Response) => {
  // 時間割の削除処理を実装する
});

// サーバーを起動
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
