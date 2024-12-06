"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config/config");
// JWTの認証とアクセス制御のミドルウェア
const authenticateToken = (req, res, next) => {
    var _a;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    if (!token)
        return res.status(401).json({ message: 'Access denied, token missing' });
    jsonwebtoken_1.default.verify(token, config_1.JWT_SECRET, (err, user) => {
        if (err)
            return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};
exports.authenticateToken = authenticateToken;
// 特定の役割にのみアクセスを許可するミドルウェア
const authorizeRole = (allowedRoles) => (req, res, next) => {
    const user = req.user;
    if (!user || !allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: 'Access denied, insufficient permissions' });
    }
    next();
};
exports.authorizeRole = authorizeRole;
