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
app.get('/api/courses', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
// 授業作成エンドポイント(配列でラッピングする必要あり)
app.post('/api/courses/add', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let dataToAdd = req.body; // リクエストボディからデータを取得
        const collectionRef = db.collection('courses');
        let count = 0; // 追加したデータの数をカウントする変数を初期化
        // オブジェクトが単体か配列かを判定
        if (!Array.isArray(dataToAdd)) {
            dataToAdd = [dataToAdd]; // 単体の場合、配列にラッピング
        }
        // データをFirestoreに追加
        const addDataToFirestore = (data) => __awaiter(void 0, void 0, void 0, function* () {
            let docId = ''; // ドキュメントIDを初期化
            if (data.department === 'departments') {
                if (data.department.length == 2) {
                    docId = `${data.name}2学科${data.grade}`; // ドキュメントIDを生成
                }
                else {
                    docId = `${data.name}全学科${data.grade}`;
                }
            }
            else {
                docId = `${data.name}${data.department}${data.grade}`; // ドキュメントIDを生成
            }
            const docRef = collectionRef.doc(docId); // ドキュメントIDを指定してドキュメントを取得
            yield docRef.set(data);
            count++; // データを追加したのでカウントを増やす
        });
        // 各データをプレーンなJavaScriptオブジェクトに変換してFirestoreに追加
        for (const item of dataToAdd) {
            yield addDataToFirestore(item);
        }
        console.log(`追加したデータの数: ${count}`); // 追加したデータの数をログに出力
        res.status(200).send('データが正常に追加されました');
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
// 時間割作成エンドポイント
app.post('/api/timetables/create', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // 時間割の作成処理を実装する
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
