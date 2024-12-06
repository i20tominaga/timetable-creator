"use strict";
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
exports.loginUser = exports.registerUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userUtils_1 = require("../utils/userUtils");
const config_1 = require("../config/config");
// ユーザー登録
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, name, password, useTimetable, role, accessLevel } = req.body;
        const users = yield (0, userUtils_1.loadUsers)();
        const existingUser = users.find((user) => user.id === id);
        if (existingUser) {
            return res.status(400).json({ message: 'このユーザーはすでに存在します' });
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const newUser = {
            id,
            name,
            password: hashedPassword,
            useTimetable,
            role,
            accessLevel,
        };
        users.push(newUser);
        yield (0, userUtils_1.writeUsers)(users);
        return res.status(201).json({ message: 'ユーザーが正常に登録されました', user: newUser });
    }
    catch (error) {
        console.error('Error registering user:', error);
        return res.status(500).json({ message: 'サーバーエラーが発生しました' });
    }
});
exports.registerUser = registerUser;
// ログイン
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, password } = req.body;
        //　ユーザーデータの取得
        const users = yield (0, userUtils_1.loadUsers)();
        const user = users.find((user) => user.name === name);
        // ユーザーが見つからない場合
        if (!user) {
            return res.status(400).json({ message: '入力されたユーザーが見つかりません' });
        }
        // ユーザーのパスワードが存在しない場合
        if (!user.password) {
            return res.status(500).json({ message: 'データベース内にユーザーのパスワードがありません' });
        }
        // パスワードの検証
        const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
        // パスワードが一致しない場合
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'パスワードが違います' });
        }
        // JWT トークンの生成
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            name: user.name,
            role: user.role,
            accessLevel: user.accessLevel,
            useTimetable: user.useTimetable,
        }, config_1.JWT_SECRET, { expiresIn: '1h' });
        return res.status(200).json({
            message: 'ログイン成功',
            token,
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                accessLevel: user.accessLevel,
                useTimetable: user.useTimetable,
            },
        });
    }
    catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ message: 'サーバーエラーが発生しました' });
    }
});
exports.loginUser = loginUser;
