"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../db"));
class TransactionService {
    constructor() {
        this.active = false;
    }
    async start() {
        try {
            this.connection = await db_1.default.getConnection();
            await this.connection.beginTransaction();
            this.active = true;
            console.log("✅ Transaction started");
            return this.connection;
        }
        catch (err) {
            console.log("❌ Failed to start transaction:", err);
            throw err;
        }
    }
    async commit() {
        if (!this.active) {
            console.log("⚠️ No active transaction to commit.");
            return;
        }
        try {
            await this.connection.commit();
            console.log("✅ Transaction committed");
        }
        catch (err) {
            console.log("❌ Commit failed, attempting rollback:", err);
            await this.rollback();
        }
        finally {
            this.release();
        }
    }
    async rollback() {
        if (!this.active) {
            console.log("⚠️ No active transaction to rollback.");
            return;
        }
        try {
            await this.connection.rollback();
            console.log("↩️ Transaction rolled back");
        }
        catch (err) {
            console.log("❌ Rollback failed:", err);
        }
        finally {
            this.release();
        }
    }
    release() {
        if (this.connection) {
            this.connection.release();
            console.log("🔓 Connection released");
            this.active = false;
        }
    }
    getConnection() {
        if (!this.connection) {
            console.log("⚠️ Attempted to get connection before starting transaction.");
        }
        return this.connection;
    }
}
exports.default = TransactionService;
