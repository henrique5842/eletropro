"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.startMonitoring = void 0;
const osu = __importStar(require("node-os-utils"));
const colorette_1 = require("colorette");
const startMonitoring = () => {
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const cpu = osu.cpu;
            const mem = osu.mem;
            const cpuUsage = yield cpu.usage();
            const memInfo = yield mem.info();
            console.clear();
            console.log((0, colorette_1.cyan)('=== Sistema Monitor ==='));
            console.log((0, colorette_1.yellow)('CPU Usage:'), (0, colorette_1.green)(`${cpuUsage.toFixed(2)}%`));
            console.log((0, colorette_1.yellow)('Memory Usage:'), (0, colorette_1.green)(`${(100 - memInfo.freeMemPercentage).toFixed(2)}%`));
            console.log((0, colorette_1.yellow)('Free Memory:'), (0, colorette_1.green)(`${memInfo.freeMemMb}MB`));
            console.log((0, colorette_1.yellow)('Total Memory:'), (0, colorette_1.green)(`${memInfo.totalMemMb}MB`));
            console.log((0, colorette_1.cyan)('====================='));
        }
        catch (error) {
            console.error('Erro ao monitorar recursos:', error);
        }
    }), 1000);
};
exports.startMonitoring = startMonitoring;
