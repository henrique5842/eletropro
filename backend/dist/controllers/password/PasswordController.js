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
exports.PasswordController = void 0;
const PasswordService_1 = require("../../services/password/PasswordService");
class PasswordController {
    static createPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return res.status(401).json({ error: 'Não autorizado' });
                }
                const { title, username, email, password, url, type } = req.body;
                if (!title || !password || !type) {
                    return res.status(400).json({ error: 'Título, senha e tipo são obrigatórios' });
                }
                if (!Object.values(PasswordService_1.PasswordType).includes(type)) {
                    return res.status(400).json({
                        error: 'Tipo de senha inválido',
                        validTypes: Object.values(PasswordService_1.PasswordType)
                    });
                }
                const result = yield PasswordService_1.PasswordService.createPassword(userId, title, password, type, username, email, url);
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
    static getAllPasswords(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return res.status(401).json({ error: 'Não autorizado' });
                }
                const passwords = yield PasswordService_1.PasswordService.getAllPasswords(userId);
                return res.status(200).json({ passwords });
            }
            catch (error) {
                return res.status(500).json({ error: 'Erro interno do servidor' });
            }
        });
    }
    static getPasswordById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return res.status(401).json({ error: 'Não autorizado' });
                }
                const { id } = req.params;
                if (!id) {
                    return res.status(400).json({ error: 'ID da senha é obrigatório' });
                }
                const password = yield PasswordService_1.PasswordService.getPasswordById(id, userId);
                return res.status(200).json({ password });
            }
            catch (error) {
                if (error instanceof Error) {
                    return res.status(404).json({ error: error.message });
                }
                return res.status(500).json({ error: 'Erro interno do servidor' });
            }
        });
    }
    static updatePassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return res.status(401).json({ error: 'Não autorizado' });
                }
                const { id } = req.params;
                const { title, username, email, password, url, type, isFavorite } = req.body;
                if (!id) {
                    return res.status(400).json({ error: 'ID da senha é obrigatório' });
                }
                const updateData = {};
                if (title !== undefined)
                    updateData.title = title;
                if (username !== undefined)
                    updateData.username = username;
                if (email !== undefined)
                    updateData.email = email;
                if (password !== undefined)
                    updateData.password = password;
                if (url !== undefined)
                    updateData.url = url;
                if (type !== undefined)
                    updateData.type = type;
                if (isFavorite !== undefined)
                    updateData.isFavorite = isFavorite;
                const updatedPassword = yield PasswordService_1.PasswordService.updatePassword(id, userId, updateData);
                return res.status(200).json({ password: updatedPassword });
            }
            catch (error) {
                if (error instanceof Error) {
                    return res.status(404).json({ error: error.message });
                }
                return res.status(500).json({ error: 'Erro interno do servidor' });
            }
        });
    }
    static toggleFavorite(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return res.status(401).json({ error: 'Não autorizado' });
                }
                const { id } = req.params;
                if (!id) {
                    return res.status(400).json({ error: 'ID da senha é obrigatório' });
                }
                const password = yield PasswordService_1.PasswordService.toggleFavorite(id, userId);
                return res.status(200).json({ password });
            }
            catch (error) {
                if (error instanceof Error) {
                    return res.status(404).json({ error: error.message });
                }
                return res.status(500).json({ error: 'Erro interno do servidor' });
            }
        });
    }
    static deletePassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return res.status(401).json({ error: 'Não autorizado' });
                }
                const { id } = req.params;
                if (!id) {
                    return res.status(400).json({ error: 'ID da senha é obrigatório' });
                }
                const result = yield PasswordService_1.PasswordService.deletePassword(id, userId);
                return res.status(200).json(result);
            }
            catch (error) {
                if (error instanceof Error) {
                    return res.status(404).json({ error: error.message });
                }
                return res.status(500).json({ error: 'Erro interno do servidor' });
            }
        });
    }
    static getFavorites(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return res.status(401).json({ error: 'Não autorizado' });
                }
                const favorites = yield PasswordService_1.PasswordService.getFavorites(userId);
                return res.status(200).json({ passwords: favorites });
            }
            catch (error) {
                return res.status(500).json({ error: 'Erro interno do servidor' });
            }
        });
    }
    static getRecentlyUsed(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return res.status(401).json({ error: 'Não autorizado' });
                }
                const limit = req.query.limit ? parseInt(req.query.limit) : 5;
                const recent = yield PasswordService_1.PasswordService.getRecentlyUsed(userId, limit);
                return res.status(200).json({ passwords: recent });
            }
            catch (error) {
                return res.status(500).json({ error: 'Erro interno do servidor' });
            }
        });
    }
    static searchPasswords(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return res.status(401).json({ error: 'Não autorizado' });
                }
                const { q } = req.query;
                if (!q) {
                    return res.status(400).json({ error: 'Termo de busca é obrigatório' });
                }
                const passwords = yield PasswordService_1.PasswordService.searchPasswords(userId, q);
                return res.status(200).json({ passwords });
            }
            catch (error) {
                return res.status(500).json({ error: 'Erro interno do servidor' });
            }
        });
    }
    static getPasswordsByType(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return res.status(401).json({ error: 'Não autorizado' });
                }
                const { type } = req.params;
                if (!type || !Object.values(PasswordService_1.PasswordType).includes(type)) {
                    return res.status(400).json({
                        error: 'Tipo de senha inválido ou não especificado',
                        validTypes: Object.values(PasswordService_1.PasswordType)
                    });
                }
                const passwords = yield PasswordService_1.PasswordService.getPasswordsByType(userId, type);
                return res.status(200).json({ passwords });
            }
            catch (error) {
                if (error instanceof Error) {
                    return res.status(400).json({ error: error.message });
                }
                return res.status(500).json({ error: 'Erro interno do servidor' });
            }
        });
    }
    static getAvailableTypes(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return res.status(200).json({
                    types: Object.values(PasswordService_1.PasswordType),
                    descriptions: {
                        BANCO: "Senhas de bancos e instituições financeiras",
                        REDE_SOCIAL: "Senhas de redes sociais e plataformas de mídia",
                        APP: "Senhas de aplicativos móveis ou desktop",
                        OUTROS: "Outras senhas que não se encaixam nas categorias anteriores"
                    }
                });
            }
            catch (error) {
                return res.status(500).json({ error: 'Erro interno do servidor' });
            }
        });
    }
}
exports.PasswordController = PasswordController;
