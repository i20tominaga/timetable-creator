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
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadInstructors = exports.writeInstructors = void 0;
const fs = __importStar(require("fs/promises"));
const instructorsFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData/Instructors.json';
// 非同期でファイルに書き込み
function writeInstructors(data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield fs.writeFile(instructorsFile, JSON.stringify(data, null, 2), 'utf8');
        }
        catch (error) {
            console.error('Error writing instructors data:', error);
            throw error;
        }
    });
}
exports.writeInstructors = writeInstructors;
// 非同期でファイルからデータを読み込み
function loadInstructors() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield fs.readFile(instructorsFile, 'utf8');
            const jsonData = JSON.parse(data);
            // データ構造に応じた返却
            return { Instructor: jsonData.Instructor || [] };
        }
        catch (error) {
            console.error('Error loading instructors data:', error);
            return { Instructor: [] }; // エラーが発生した場合は空配列を返す
        }
    });
}
exports.loadInstructors = loadInstructors;
