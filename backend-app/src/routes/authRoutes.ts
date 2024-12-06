import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/authController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// ユーザー登録エンドポイント
router.post('/register', registerUser);

// ユーザーログインエンドポイント
router.post('/login', loginUser);

// 認証が必要なエンドポイント
router.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'This is a protected route' });
});

// 管理者のみアクセス可能なエンドポイント
router.get('/admin', authenticateToken, authorizeRole(['admin']), (req, res) => {
    res.json({ message: 'Welcome, admin' });
});

export default router;
