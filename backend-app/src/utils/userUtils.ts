import fs from 'fs';
import path from 'path';
import { User } from '../types/types';

const userFilePath = path.join(__dirname, '../../../SampleData/Users.json');

// ユーザー情報の読み込み
export const loadUsers = async (): Promise<User[]> => {
    try {
        const data = await fs.promises.readFile(userFilePath, 'utf-8');
        const jsonData = JSON.parse(data);

        // jsonData.User が配列であることを確認し、それが配列なら返す
        if (jsonData && Array.isArray(jsonData.User)) {
            return jsonData.User;
        } else {
            console.error('Unexpected format: jsonData.User is not an array');
            return [];
        }
    } catch (error) {
        console.error('Error loading users data:', error);
        return [];
    }
};

// ユーザー情報の書き込み (非同期化とエラーハンドリング追加)
export const writeUsers = async (users: User[]): Promise<void> => {
    try {
        const jsonData = { User: users };
        await fs.promises.writeFile(userFilePath, JSON.stringify(jsonData, null, 2));
        console.log('User data written successfully');
    } catch (error) {
        console.error('Error writing users data:', error);
    }
};
