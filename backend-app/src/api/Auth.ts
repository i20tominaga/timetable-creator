import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { User } from '../types/types';

dotenv.config();

const userFilePath = path.join(__dirname, '../../../SampleData/Users.json');

// ユーザー情報の読み込み
export const loadUsers = async (): Promise<User[]> => {
    try {
        const data = await fs.promises.readFile(userFilePath, 'utf-8');
        const jsonData = JSON.parse(data);

        // 配列であることを確認してから返す
        if (Array.isArray(jsonData.User)) {
            return jsonData.User;
        } else {
            console.error('Unexpected format: User is not an array');
            return [];
        }
    } catch (error) {
        console.error('Error loading users data:', error);
        return [];
    }
};
// ユーザー情報の書き込み
export const writeUsers = (users: User[]) => {
    fs.writeFileSync(userFilePath, JSON.stringify(users, null, 2));
}
