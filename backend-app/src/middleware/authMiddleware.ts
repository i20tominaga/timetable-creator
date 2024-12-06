import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/config';

// JWTの認証とアクセス制御のミドルウェア
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: 'Access denied, token missing' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        (req as any).user = user;
        next();
    });
};

// 特定の役割にのみアクセスを許可するミドルウェア
export const authorizeRole = (allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: 'Access denied, insufficient permissions' });
    }
    next();
};
