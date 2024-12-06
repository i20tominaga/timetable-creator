import * as fs from 'fs';
import * as path from 'path';

// TimeTables.jsonのパス
const timeTablesPath = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code//SampleData/TimeTables.json';
// ディレクトリのパス
const directoryPath = '/Users/tominagaayumu/Library/CloudStorage/OneDrive-独立行政法人国立高等専門学校機構/卒研/code/SampleData';

// TimeTables.jsonを読み込む関数
function loadTimeTables(): { name: string, file: string }[] {
    if (fs.existsSync(timeTablesPath)) {
        const data = fs.readFileSync(timeTablesPath, 'utf8');
        return JSON.parse(data);
    }
    return [];
}

// TimeTables.jsonに書き込む関数
function saveTimeTables(timeTables: { name: string, file: string }[]): void {
    const jsonData = JSON.stringify(timeTables, null, 2);
    fs.writeFileSync(timeTablesPath, jsonData, 'utf8');
}


// ディレクトリが存在しない場合は作成
if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
}

// JSONファイルに書き込むデータ
const data = {
    name: "John Doe",
    age: 30,
    profession: "Software Developer"
};

// JSONデータを文字列に変換
const jsonData = JSON.stringify(data, null, 2);

// ディレクトリ内のファイル一覧を取得
const files = fs.readdirSync(directoryPath);

// "Export"で始まるファイル名をフィルタリング
const exportFiles = files.filter(file => file.startsWith('Export') && file.endsWith('.json'));

// ファイル名から番号を抽出して最大値を求める
const maxNumber = exportFiles.reduce((max, file) => {
    const match = file.match(/^Export(\d+)\.json$/);
    if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
    }
    return max;
}, 0);

// 新しいファイル名を決定
const newFileNumber = maxNumber + 1;
const fileName = `Export${newFileNumber}.json`;

// ファイルのパス
const filePath = path.join(directoryPath, fileName);

// JSONデータを書き込む
fs.writeFileSync(filePath, jsonData, 'utf8');

// TimeTables.jsonの読み込み
let timeTables = loadTimeTables();

// 新しいエントリを追加
timeTables.push({
    name: `Export${newFileNumber}`,
    file: filePath
});

// TimeTables.jsonに書き込む
saveTimeTables(timeTables);

// ファイル名とパスを表示
console.log('ファイル名:', fileName);
console.log('ファイルパス:', filePath);


