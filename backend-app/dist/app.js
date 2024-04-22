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
const admin = __importStar(require("firebase-admin"));
const bodyParser = __importStar(require("body-parser"));
const serviceAccount = require('/Users/tominagaayumu/Downloads/秘密鍵/testdata-684fc-firebase-adminsdk-9vujs-cfd14231bd.json'); // Firebaseのサービスアカウントキーのパスを指定
const app = (0, express_1.default)();
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
app.get('/api/courses/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const coursesRef = db.collection('courses');
        const snapshot = yield coursesRef.get();
        const courses = [];
        snapshot.forEach((doc) => {
            courses.push({
                id: doc.id,
                data: doc.data()
            });
        });
        res.status(200).json(courses);
    }
    catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).send('Internal Server Error');
    }
}));
// 授業作成APIエンドポイント
app.post('/api/courses/add', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let newDataArray = [];
        if (Array.isArray(req.body)) {
            newDataArray = req.body;
        }
        else if (typeof req.body === 'object' && req.body !== null) {
            newDataArray = [req.body];
        }
        else {
            console.error('無効なリクエストボディです');
            return res.status(400).send('無効なリクエストボディです');
        }
        // データ配列内の各オブジェクトをFirestoreに追加
        const promises = newDataArray.map((newData) => __awaiter(void 0, void 0, void 0, function* () {
            let docId;
            const { name, grade, department, departments, instructor, room } = newData;
            if (Array.isArray(departments) && departments.length > 0) {
                docId = `${name}${departments.length}学科${grade}`;
            }
            else if (typeof department === 'string' && department.trim() !== '') {
                docId = `${name}${department}${grade}`;
            }
            else {
                console.error('departmentまたはdepartmentsが適切に指定されていません');
                return null;
            }
            if (!docId) {
                console.error('ドキュメントIDを生成できませんでした:', newData);
                return null;
            }
            const docRef = db.collection('courses').doc(docId); // ドキュメントIDを指定してドキュメント参照を取得
            const docSnapshot = yield docRef.get(); // ドキュメントの存在を確認
            if (docSnapshot.exists) {
                console.error('ドキュメントIDが重複しています:', docId);
                return null;
            }
            yield docRef.set(newData);
            console.log('データがFirestoreに追加されました'); // データが追加されたことをログに出力
            return docId; // 追加したドキュメントのIDを返す
        }));
        // 全てのデータ追加のPromiseを待機し、追加されたドキュメントIDを取得
        const docIds = yield Promise.all(promises);
        // 追加されたドキュメントIDの配列をクライアントに返す
        res.status(200).json(docIds.filter(id => id !== null)); // nullを除外して返す
    }
    catch (error) {
        console.error('データの追加中にエラーが発生しました:', error);
        res.status(500).send('データの追加中にエラーが発生しました');
    }
}));
// 授業更新エンドポイント
app.put('/api/courses/update/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courseId = req.params.id;
        const newData = req.body; // 更新されたデータをリクエストボディから取得
        const docRef = db.collection('courses').doc(courseId);
        const doc = yield docRef.get();
        if (doc.exists) {
            // ドキュメントが存在する場合は更新する
            yield docRef.update(newData);
            console.log('データがFirestoreで更新されました'); // 更新メッセージを出力
            res.status(200).send('データが正常に更新されました');
        }
        else {
            res.status(404).send('Document not found');
        }
    }
    catch (error) {
        console.error('Error updating document:', error);
        res.status(500).send('Internal Server Error');
    }
}));
// 全ての授業を削除するエンドポイント
app.delete('/api/courses/deleteAll', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 全ての授業を削除
        yield db.collection('courses').get().then(snapshot => {
            snapshot.forEach(doc => {
                doc.ref.delete();
            });
        });
        console.log('全てのデータがFirestoreから削除されました'); // ログに削除メッセージを出力
        res.status(200).send('全てのデータが正常に削除されました');
    }
    catch (error) {
        console.error('Error deleting all documents:', error);
        res.status(500).send('Internal Server Error');
    }
}));
// 特定の授業を削除するエンドポイント
app.delete('/api/courses/delete/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courseId = req.params.id;
        const docRef = db.collection('courses').doc(courseId);
        const doc = yield docRef.get();
        if (doc.exists) {
            // ドキュメントが存在する場合は削除する
            yield docRef.delete();
            console.log('データがFirestoreから削除されました'); // ログに削除メッセージを出力
            res.status(200).send('データが正常に削除されました');
        }
        else {
            res.status(404).send('Document not found');
        }
    }
    catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).send('Internal Server Error');
    }
}));
// 時間割取得エンドポイント
app.get('/api/timetables', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // 時間割の取得処理を実装する
}));
// 時間割詳細取得エンドポイント
app.get('/api/timetables/detail/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // 時間割の詳細情報取得処理を実装する
}));
// 時間割作成APIエンドポイント
app.post('/api/timetables/create', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const startTime = performance.now(); // 処理開始時刻を記録
        const coursesSnapshot = yield db.collection('courses').get(); // Firebaseから授業データを取得
        if (coursesSnapshot.empty) {
            throw new Error('No courses found in Firestore');
        }
        // 時間割を格納する配列
        const timetable = [];
        // 曜日ごとにデータを整理
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        for (const day of daysOfWeek) {
            const dayData = {}; // 曜日ごとのデータを作成
            const grades = ['1', '2', '3', '4', '5', '専1', '専2'];
            for (const grade of grades) {
                const gradeData = {}; // 学年ごとのデータを作成
                const classes = ['ME', 'IE', 'CA'];
                for (const cls of classes) {
                    const classData = {}; // クラスごとのデータを作成
                    const timeSlots = ['1,2限', '3,4限', '5,6限', '7,8限'];
                    const usedCourses = {}; // 重複チェック用のオブジェクト
                    for (const slot of timeSlots) {
                        const courseSnapshot = coursesSnapshot.docs.find(doc => doc.data().grade === grade && doc.data().department === cls &&
                            !usedCourses[doc.id] // 既に使用済みの授業かどうかをチェック
                        );
                        if (courseSnapshot) {
                            usedCourses[courseSnapshot.id] = true; // 使用済みとしてマーク
                            classData[slot] = { course: courseSnapshot.data() }; // 授業データを格納
                        }
                        else {
                            console.error(`No course found for ${cls} ${grade}`);
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
        res.status(200).json(timetable); // 完成した時間割データを返す
    }
    catch (error) {
        console.error('時間割の作成中にエラーが発生しました:', error);
        res.status(500).send('時間割の作成中にエラーが発生しました');
    }
}));
// 時間割更新エンドポイント
app.put('/api/timetables/update/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // 時間割の更新処理を実装する
}));
// 時間割削除エンドポイント
app.delete('/api/timetables/delete/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // 時間割の削除処理を実装する
}));
// サーバーを起動
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
