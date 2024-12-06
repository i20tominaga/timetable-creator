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
const config_1 = require("config/config");
//　ユーザー登録
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, name, password, useTimetable, role, accessLevel } = req.body;
    const users = yield (0, userUtils_1.loadUsers)();
    const existingUser = users.find((user) => user.id === id);
    if (existingUser) {
        res.status(400).send('User already exists');
        return;
    }
    const hashedPassword = yield bcrypt_1.default.hash(password, 10);
    const newUser = {
        id,
        name,
        password: hashedPassword,
        useTimetable,
        role,
        accessLevel
    };
    users.push(newUser);
    (0, userUtils_1.writeUsers)(users);
});
exports.registerUser = registerUser;
//　ログイン
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, password } = req.body;
    const users = yield (0, userUtils_1.loadUsers)();
    const user = users.find((user) => user.id === id);
    if (!user) {
        res.status(400).send('User not found');
        return;
    }
    const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
    if (!isPasswordValid) {
        res.status(400).send('Invalid password');
        return;
    }
    const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role, accessLevel: user.accessLevel }, config_1.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
});
exports.loginUser = loginUser;
