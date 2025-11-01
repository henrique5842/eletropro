"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const colorette_1 = require("colorette");
const monitor_1 = require("./utils/monitor");
const cors_1 = __importDefault(require("cors"));
const AuthRoutes_1 = __importDefault(require("./routes/users/AuthRoutes"));
const PasswordRoutes_1 = __importDefault(require("./routes/password/PasswordRoutes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/auth', AuthRoutes_1.default);
app.use('/password', PasswordRoutes_1.default);
const PORT = 3000;
app.listen(PORT, () => {
    console.log((0, colorette_1.green)('🚀 Server running on port 3000'));
    (0, monitor_1.startMonitoring)();
});
process.on('uncaughtException', (error) => {
    console.error((0, colorette_1.red)('Uncaught Exception:'), error);
});
process.on('unhandledRejection', (error) => {
    console.error((0, colorette_1.red)('Unhandled Rejection:'), error);
});
