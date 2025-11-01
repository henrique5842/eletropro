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
const AuthController_1 = require("../../controllers/users/AuthController");
const UserController_1 = require("../../controllers/users/UserController");
const Auth_1 = require("../../middlewares/Auth");
const router = express_1.default.Router();
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield AuthController_1.AuthController.register(req, res);
}));
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield AuthController_1.AuthController.login(req, res);
}));
router.post('/check-email-availability', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield AuthController_1.AuthController.checkEmailAvailability(req, res);
}));
router.post('/check-email', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield AuthController_1.AuthController.checkEmailExists(req, res);
}));
router.post('/check-reset-code', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield AuthController_1.AuthController.checkResetCode(req, res);
}));
router.post('/forgot-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield AuthController_1.AuthController.requestPasswordReset(req, res);
}));
router.post('/verify-reset-code', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield AuthController_1.AuthController.verifyResetCode(req, res);
}));
router.post('/reset-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield AuthController_1.AuthController.resetPassword(req, res);
}));
router.use(Auth_1.authMiddleware);
router.get('/profile', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield AuthController_1.AuthController.getProfile(req, res);
}));
router.put('/profile', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield UserController_1.UserController.updateProfile(req, res);
}));
exports.default = router;
