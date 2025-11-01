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
exports.AuthController = void 0;
const AuthService_1 = require("../../services/users/AuthService");
const Prisma_1 = require("../../lib/Prisma");
class AuthController {
    static checkEmailAvailability(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email } = req.body;
                if (!email) {
                    return res.status(400).json({ error: 'Email é obrigatório' });
                }
                yield AuthService_1.AuthService.checkEmailExists(email);
                return res.status(200).json({ message: 'Email disponível' });
            }
            catch (error) {
                if (error instanceof Error) {
                    return res.status(400).json({ error: error.message });
                }
                return res.status(500).json({ error: 'Erro interno do servidor' });
            }
        });
    }
    static checkEmailExists(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email } = req.body;
                if (!email) {
                    return res.status(400).json({ error: 'Email é obrigatório' });
                }
                const result = yield AuthService_1.AuthService.verifyEmailExists(email);
                return res.status(200).json(result);
            }
            catch (error) {
                if (error instanceof Error) {
                    return res.status(400).json({ error: error.message });
                }
                return res.status(500).json({ error: 'Erro interno do servidor' });
            }
        });
    }
    static checkResetCode(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, code } = req.body;
                if (!email || !code) {
                    return res.status(400).json({ error: 'Email e código são obrigatórios' });
                }
                const result = yield AuthService_1.AuthService.checkResetCode(email, code);
                return res.status(200).json(result);
            }
            catch (error) {
                if (error instanceof Error) {
                    return res.status(400).json({ error: error.message });
                }
                return res.status(500).json({ error: 'Erro interno do servidor' });
            }
        });
    }
    static register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, email, password, avatar } = req.body;
                if (!name || !email || !password) {
                    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
                }
                const result = yield AuthService_1.AuthService.register(name, email, password, avatar);
                return res.status(201).json(result);
            }
            catch (error) {
                if (error instanceof Error) {
                    return res.status(400).json({ error: error.message });
                }
                return res.status(500).json({ error: 'Erro interno do servidor' });
            }
        });
    }
    static login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password } = req.body;
                if (!email || !password) {
                    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
                }
                const result = yield AuthService_1.AuthService.login(email, password);
                return res.status(200).json(result);
            }
            catch (error) {
                if (error instanceof Error) {
                    return res.status(400).json({ error: error.message });
                }
                return res.status(500).json({ error: 'Erro interno do servidor' });
            }
        });
    }
    static getProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return res.status(401).json({ error: 'Não autorizado' });
                }
                const user = yield Prisma_1.prisma.user.findUnique({
                    where: { id: userId },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                });
                if (!user) {
                    return res.status(404).json({ error: 'Usuário não encontrado' });
                }
                return res.status(200).json({ user });
            }
            catch (error) {
                return res.status(500).json({ error: 'Erro interno do servidor' });
            }
        });
    }
    static requestPasswordReset(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email } = req.body;
                if (!email) {
                    return res.status(400).json({ error: 'Email é obrigatório' });
                }
                const result = yield AuthService_1.AuthService.requestPasswordReset(email);
                return res.status(200).json(result);
            }
            catch (error) {
                if (error instanceof Error) {
                    return res.status(400).json({ error: error.message });
                }
                return res.status(500).json({ error: 'Erro interno do servidor' });
            }
        });
    }
    static verifyResetCode(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, code } = req.body;
                if (!email || !code) {
                    return res.status(400).json({ error: 'Email e código são obrigatórios' });
                }
                const result = yield AuthService_1.AuthService.verifyResetCode(email, code);
                return res.status(200).json(result);
            }
            catch (error) {
                if (error instanceof Error) {
                    return res.status(400).json({ error: error.message });
                }
                return res.status(500).json({ error: 'Erro interno do servidor' });
            }
        });
    }
    static resetPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, code, newPassword } = req.body;
                if (!email || !code || !newPassword) {
                    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
                }
                const result = yield AuthService_1.AuthService.resetPassword(email, code, newPassword);
                return res.status(200).json(result);
            }
            catch (error) {
                if (error instanceof Error) {
                    return res.status(400).json({ error: error.message });
                }
                return res.status(500).json({ error: 'Erro interno do servidor' });
            }
        });
    }
}
exports.AuthController = AuthController;
