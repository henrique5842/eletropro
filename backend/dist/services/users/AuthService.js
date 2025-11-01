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
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Prisma_1 = require("../../lib/Prisma");
const EmailService_1 = require("../email/EmailService");
class AuthService {
    static checkEmailExists(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield Prisma_1.prisma.user.findUnique({ where: { email } });
            if (user) {
                throw new Error('Email já registrado');
            }
            return { message: 'Email disponível' };
        });
    }
    static verifyEmailExists(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield Prisma_1.prisma.user.findUnique({ where: { email } });
            if (!user) {
                throw new Error('Email não cadastrado');
            }
            return { message: 'Email encontrado' };
        });
    }
    static checkResetCode(email, code) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield Prisma_1.prisma.user.findUnique({ where: { email } });
            if (!user || !user.resetCode) {
                throw new Error('Código inválido');
            }
            if (user.resetCode !== code) {
                throw new Error('Código inválido');
            }
            if (user.resetCodeExpires && user.resetCodeExpires < new Date()) {
                throw new Error('Código expirado');
            }
            return { message: 'Código válido' };
        });
    }
    static register(name, email, password, avatar) {
        return __awaiter(this, void 0, void 0, function* () {
            const userExists = yield Prisma_1.prisma.user.findUnique({ where: { email } });
            if (userExists) {
                throw new Error('Email já registrado');
            }
            const hashedPassword = yield bcrypt_1.default.hash(password, 10);
            const user = yield Prisma_1.prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    avatar,
                },
            });
            const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
            return {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar
                },
                token
            };
        });
    }
    static login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield Prisma_1.prisma.user.findUnique({ where: { email } });
            if (!user) {
                throw new Error('Usuário não encontrado');
            }
            const validPassword = yield bcrypt_1.default.compare(password, user.password);
            if (!validPassword) {
                throw new Error('Senha inválida');
            }
            const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
            return {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar
                },
                token
            };
        });
    }
    static requestPasswordReset(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield Prisma_1.prisma.user.findUnique({ where: { email } });
            if (!user) {
                throw new Error('Email não cadastrado');
            }
            const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
            const resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
            yield Prisma_1.prisma.user.update({
                where: { email },
                data: {
                    resetCode,
                    resetCodeExpires
                }
            });
            yield EmailService_1.EmailService.sendResetCode(email, resetCode);
            return { message: 'Código enviado para o email' };
        });
    }
    static verifyResetCode(email, code) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.checkResetCode(email, code);
            return result;
        });
    }
    static resetPassword(email, code, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkResetCode(email, code);
            const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
            yield Prisma_1.prisma.user.update({
                where: { email },
                data: {
                    password: hashedPassword,
                    resetCode: null,
                    resetCodeExpires: null
                }
            });
            return { message: 'Senha alterada com sucesso' };
        });
    }
}
exports.AuthService = AuthService;
