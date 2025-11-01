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
const express_1 = __importDefault(require("express"));
const PasswordController_1 = require("../../controllers/password/PasswordController");
const Auth_1 = require("../../middlewares/Auth");
const router = express_1.default.Router();
router.use(Auth_1.authMiddleware);
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield PasswordController_1.PasswordController.createPassword(req, res);
}));
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield PasswordController_1.PasswordController.getAllPasswords(req, res);
}));
router.get('/favorites', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield PasswordController_1.PasswordController.getFavorites(req, res);
}));
router.get('/recent', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield PasswordController_1.PasswordController.getRecentlyUsed(req, res);
}));
router.get('/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield PasswordController_1.PasswordController.searchPasswords(req, res);
}));
router.get('/types', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield PasswordController_1.PasswordController.getAvailableTypes(req, res);
}));
router.get('/type/:type', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield PasswordController_1.PasswordController.getPasswordsByType(req, res);
}));
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield PasswordController_1.PasswordController.getPasswordById(req, res);
}));
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield PasswordController_1.PasswordController.updatePassword(req, res);
}));
router.patch('/:id/favorite', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield PasswordController_1.PasswordController.toggleFavorite(req, res);
}));
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield PasswordController_1.PasswordController.deletePassword(req, res);
}));
exports.default = router;
