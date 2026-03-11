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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordService = exports.PasswordType = void 0;
const Prisma_1 = require("../../lib/Prisma");
var PasswordType;
(function (PasswordType) {
    PasswordType["BANCO"] = "BANCO";
    PasswordType["REDE_SOCIAL"] = "REDE_SOCIAL";
    PasswordType["APP"] = "APP";
    PasswordType["OUTROS"] = "OUTROS";
})(PasswordType || (exports.PasswordType = PasswordType = {}));
class PasswordService {
    static createPassword(userId, title, password, type, username, email, url) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Object.values(PasswordType).includes(type)) {
                throw new Error('Tipo de senha inválido. Use BANCO, REDE_SOCIAL, APP ou OUTROS');
            }
            const newPassword = yield Prisma_1.prisma.password.create({
                data: {
                    title,
                    username,
                    email,
                    password,
                    url,
                    type,
                    userId
                }
            });
            return {
                id: newPassword.id,
                title: newPassword.title,
                username: newPassword.username,
                email: newPassword.email,
                password: newPassword.password,
                url: newPassword.url,
                type: newPassword.type,
                isFavorite: newPassword.isFavorite,
                lastUsed: newPassword.lastUsed,
                createdAt: newPassword.createdAt,
                updatedAt: newPassword.updatedAt
            };
        });
    }
    static getAllPasswords(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const passwords = yield Prisma_1.prisma.password.findMany({
                where: { userId },
                orderBy: { updatedAt: 'desc' }
            });
            return passwords;
        });
    }
    static getPasswordById(id, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const password = yield Prisma_1.prisma.password.findFirst({
                where: {
                    id,
                    userId
                }
            });
            if (!password) {
                throw new Error('Senha não encontrada');
            }
            yield Prisma_1.prisma.password.update({
                where: { id },
                data: { lastUsed: new Date() }
            });
            return password;
        });
    }
    static updatePassword(id, userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const passwordExists = yield Prisma_1.prisma.password.findFirst({
                where: {
                    id,
                    userId
                }
            });
            if (!passwordExists) {
                throw new Error('Senha não encontrada');
            }
            const updatedPassword = yield Prisma_1.prisma.password.update({
                where: { id },
                data: Object.assign(Object.assign({}, data), { updatedAt: new Date() })
            });
            return updatedPassword;
        });
    }
    static toggleFavorite(id, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const password = yield Prisma_1.prisma.password.findFirst({
                where: {
                    id,
                    userId
                }
            });
            if (!password) {
                throw new Error('Senha não encontrada');
            }
            const updatedPassword = yield Prisma_1.prisma.password.update({
                where: { id },
                data: {
                    isFavorite: !password.isFavorite,
                    updatedAt: new Date()
                }
            });
            return updatedPassword;
        });
    }
    static deletePassword(id, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const password = yield Prisma_1.prisma.password.findFirst({
                where: {
                    id,
                    userId
                }
            });
            if (!password) {
                throw new Error('Senha não encontrada');
            }
            yield Prisma_1.prisma.password.delete({
                where: { id }
            });
            return { message: 'Senha excluída com sucesso' };
        });
    }
    static getFavorites(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const favorites = yield Prisma_1.prisma.password.findMany({
                where: {
                    userId,
                    isFavorite: true
                },
                orderBy: { updatedAt: 'desc' }
            });
            return favorites;
        });
    }
    static getRecentlyUsed(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, limit = 5) {
            const recent = yield Prisma_1.prisma.password.findMany({
                where: { userId },
                orderBy: { lastUsed: 'desc' },
                take: limit
            });
            return recent;
        });
    }
    static searchPasswords(userId, searchTerm) {
        return __awaiter(this, void 0, void 0, function* () {
            const passwords = yield Prisma_1.prisma.password.findMany({
                where: {
                    userId,
                    OR: [
                        { title: { contains: searchTerm, mode: 'insensitive' } },
                        { username: { contains: searchTerm, mode: 'insensitive' } },
                        { email: { contains: searchTerm, mode: 'insensitive' } },
                        { url: { contains: searchTerm, mode: 'insensitive' } }
                    ]
                },
                orderBy: { updatedAt: 'desc' }
            });
            return passwords;
        });
    }
    static getPasswordsByType(userId, type) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Object.values(PasswordType).includes(type)) {
                throw new Error('Tipo de senha inválido. Use BANCO, REDE_SOCIAL, APP ou OUTROS');
            }
            const passwords = yield Prisma_1.prisma.password.findMany({
                where: {
                    userId,
                    type
                },
                orderBy: { updatedAt: 'desc' }
            });
            return passwords;
        });
    }
}
exports.PasswordService = PasswordService;
