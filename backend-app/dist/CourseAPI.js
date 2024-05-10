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
exports.write = exports.load = exports.course_file = void 0;
const fs_1 = __importDefault(require("fs"));
exports.course_file = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/TestData/Test_Courses.json'; // JSONファイルのパス
// ファイルからJSONデータを非同期で読み込む関数
function load() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield fs_1.default.promises.readFile(exports.course_file, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            console.error('JSONファイルの読み込みエラー:', error);
            return null;
        }
    });
}
exports.load = load;
// JSONファイルにデータを書き込む関数
function write(data) {
    fs_1.default.writeFileSync(exports.course_file, JSON.stringify(data, null, 2));
}
exports.write = write;
