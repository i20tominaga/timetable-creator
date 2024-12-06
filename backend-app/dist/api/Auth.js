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
exports.writeUsers = exports.loadUsers = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const userFilePath = path_1.default.join(__dirname, '../../../SampleData/Users.json');
// ユーザー情報の読み込み
const loadUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield fs_1.default.promises.readFile(userFilePath, 'utf-8');
        const jsonData = JSON.parse(data);
        // 配列であることを確認してから返す
        if (Array.isArray(jsonData.User)) {
            return jsonData.User;
        }
        else {
            console.error('Unexpected format: User is not an array');
            return [];
        }
    }
    catch (error) {
        console.error('Error loading users data:', error);
        return [];
    }
});
exports.loadUsers = loadUsers;
// ユーザー情報の書き込み
const writeUsers = (users) => {
    fs_1.default.writeFileSync(userFilePath, JSON.stringify(users, null, 2));
};
exports.writeUsers = writeUsers;
