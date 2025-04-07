"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../db"));
class TransactionService {
    async start() {
        this.connection = await db_1.default.getConnection();
        await this.connection.beginTransaction();
        return this.connection;
    }
    async commit() {
        try {
            await this.connection.commit();
        }
        finally {
            this.connection.release();
        }
    }
    async rollback() {
        try {
            await this.connection.rollback();
        }
        finally {
            this.connection.release();
        }
    }
    getConnection() {
        return this.connection;
    }
}
exports.default = TransactionService;
