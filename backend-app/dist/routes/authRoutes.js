"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// ユーザー登録エンドポイント
router.post('/register', authController_1.registerUser);
// ユーザーログインエンドポイント
router.post('/login', authController_1.loginUser);
// 認証が必要なエンドポイント
router.get('/protected', authMiddleware_1.authenticateToken, (req, res) => {
    res.json({ message: 'This is a protected route' });
});
// 管理者のみアクセス可能なエンドポイント
router.get('/admin', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorizeRole)(['admin']), (req, res) => {
    res.json({ message: 'Welcome, admin' });
});
exports.default = router;
