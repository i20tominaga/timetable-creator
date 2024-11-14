import * as fs from 'fs/promises';
import * as path from 'path';
import { InstructorJson } from './types';

const instructorsFile = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData/Instructors.json';

// 非同期でファイルに書き込み
export async function writeInstructors(data: InstructorJson) {
    try {
        await fs.writeFile(instructorsFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing instructors data:', error);
        throw error;
    }
}

// 非同期でファイルからデータを読み込み
export async function loadInstructors(): Promise<InstructorJson> {
    try {
        const data = await fs.readFile(instructorsFile, 'utf8');
        const jsonData = JSON.parse(data);

        // データ構造に応じた返却
        return { Instructor: jsonData.Instructor || [] };
    } catch (error) {
        console.error('Error loading instructors data:', error);
        return { Instructor: [] }; // エラーが発生した場合は空配列を返す
    }
}
