import express, { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import * as bodyParser from 'body-parser';

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
app.get('/api/courses', async (req: Request, res: Response) => {
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

// 授業作成エンドポイント
app.post('/api/courses/add', async (req: Request, res: Response) => {
    try {
        const newData = req.body; // リクエストボディからデータを取得
        // データをFirestoreに追加
        const docRef = db.collection('courses').doc('mechanicalBasics');
        await docRef.set(newData);
        console.log('データがFirestoreに追加されました:', newData); // データが追加されたことをログに出力
        res.status(200).send('データが正常に追加されました');
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

// 時間割作成エンドポイント
app.post('/api/timetables/create', async (req: Request, res: Response) => {
  // 時間割の作成処理を実装する
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
