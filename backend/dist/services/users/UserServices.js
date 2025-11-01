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
const bcrypt_1 = __importDefault(require("bcrypt"));
class UserController {
    static updateProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return res.status(401).json({ error: 'Não autorizado' });
                }
                const { name, currentPassword, newPassword, avatar } = req.body;
                const updateData = {};
                if (name)
                    updateData.name = name;
                if (avatar)
                    updateData.avatar = avatar;
                if (newPassword) {
                    if (!currentPassword) {
                        return res.status(400).json({ error: 'Senha atual é obrigatória para alterar a senha' });
                    }
                    const user = yield Prisma_1.prisma.user.findUnique({ where: { id: userId } });
                    if (!user) {
                        return res.status(404).json({ error: 'Usuário não encontrado' });
                    }
                    const validPassword = yield bcrypt_1.default.compare(currentPassword, user.password);
                    if (!validPassword) {
                        return res.status(400).json({ error: 'Senha atual inválida' });
                    }
                    updateData.password = yield bcrypt_1.default.hash(newPassword, 10);
                }
                const updatedUser = yield Prisma_1.prisma.user.update({
                    where: { id: userId },
                    data: updateData,
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true
                    }
                });
                return res.status(200).json({
                    message: 'Perfil atualizado com sucesso',
                    user: updatedUser
                });
            }
            catch (error) {
                console.error('Erro ao atualizar perfil:', error);
                return res.status(500).json({ error: 'Erro interno do servidor' });
            }
        });
    }
}
exports.UserController = UserController;
