"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const Prisma_1 = require("../../lib/Prisma");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class UserController {
    static getProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }
                const user = yield Prisma_1.prisma.user.findUnique({
                    where: { id: userId },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                        createdAt: true
                    }
                });
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }
                return res.status(200).json(user);
            }
            catch (error) {
                if (error instanceof Error) {
                    return res.status(400).json({ error: error.message });
                }
                return res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static updateProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const { name, email, username, birthDate } = req.body;
                if (!userId) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }
                const updatedUser = yield Prisma_1.prisma.user.update({
                    where: { id: userId },
                    data: { name, email },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                        createdAt: true
                    }
                });
                return res.status(200).json(updatedUser);
            }
            catch (error) {
                if (error instanceof Error) {
                    return res.status(400).json({ error: error.message });
                }
                return res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static updateAvatar(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const avatarFile = req.file;
                if (!userId) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }
                if (!avatarFile) {
                    return res.status(400).json({ error: 'No avatar file provided' });
                }
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                if (!allowedTypes.includes(avatarFile.mimetype)) {
                    return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, and GIF are allowed.' });
                }
                const avatarUrl = `/uploads/avatars/${avatarFile.filename}`;
                const currentUser = yield Prisma_1.prisma.user.findUnique({
                    where: { id: userId },
                    select: { avatar: true }
                });
                if (currentUser === null || currentUser === void 0 ? void 0 : currentUser.avatar) {
                    const oldAvatarPath = path_1.default.resolve(__dirname, '../../public', currentUser.avatar);
                    if (fs_1.default.existsSync(oldAvatarPath)) {
                        fs_1.default.unlinkSync(oldAvatarPath);
                    }
                }
                const updatedUser = yield Prisma_1.prisma.user.update({
                    where: { id: userId },
                    data: { avatar: avatarUrl },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                        createdAt: true
                    }
                });
                return res.status(200).json(updatedUser);
            }
            catch (error) {
                if (error instanceof Error) {
                    return res.status(400).json({ error: error.message });
                }
                return res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
}
exports.UserController = UserController;
