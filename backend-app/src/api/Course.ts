import fs from 'fs';

export const course_file = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData/Courses.json'; // JSONファイルのパス
export const teacher_file = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData/Instructors.json'; // JSONファイルのパス

// ファイルからJSONデータを非同期で読み込む関数
export async function load(): Promise<any> {
    try {
        const data = await fs.promises.readFile(course_file, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('JSONファイルの読み込みエラー:', error);
        throw new Error('コースデータの読み込みに失敗しました。');
    }
}

// JSONファイルにデータを書き込む関数
export function write(data: any) {
    fs.writeFileSync(course_file, JSON.stringify(data, null, 2));
}
