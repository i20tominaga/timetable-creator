import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../types/types';
import { loadUsers, writeUsers } from '../utils/userUtils';
import { JWT_SECRET } from '../config/config';

// ユーザー登録
export const registerUser = async (req: Request, res: Response) => {
    try {
        const { id, name, password, useTimetable, role, accessLevel } = req.body;

        const users = await loadUsers();
        const existingUser = users.find((user) => user.id === id);

        if (existingUser) {
            return res.status(400).json({ message: 'このユーザーはすでに存在します' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser: User = {
            id,
            name,
            password: hashedPassword,
            useTimetable,
            role,
            accessLevel,
        };

        users.push(newUser);
        await writeUsers(users);

        return res.status(201).json({ message: 'ユーザーが正常に登録されました', user: newUser });
    } catch (error) {
        console.error('Error registering user:', error);
        return res.status(500).json({ message: 'サーバーエラーが発生しました' });
    }
};

// ログイン
export const loginUser = async (req: Request, res: Response) => {
    try {
        const { name, password } = req.body;

        //　ユーザーデータの取得
        const users = await loadUsers();
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
        const isPasswordValid = await bcrypt.compare(password, user.password);
        // パスワードが一致しない場合
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'パスワードが違います' });
        }

        // JWT トークンの生成
        const token = jwt.sign(
            {
                id: user.id,
                name: user.name,
                role: user.role,
                accessLevel: user.accessLevel,
                useTimetable: user.useTimetable,
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

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
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ message: 'サーバーエラーが発生しました' });
    }
};
