"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserById = exports.EditUser = exports.addUser = exports.getUserById = exports.getAllUsers = void 0;
const db_1 = __importDefault(require("../db"));
const logger_1 = __importDefault(require("../logger"));
const transactionService_1 = __importDefault(require("../utils/transactionService"));
// GET ALL USERS
const getAllUsers = async (req) => {
    const query = "SELECT id, fullname, email, mobile FROM TESTAPI";
    try {
        const [records] = await db_1.default.execute(query);
        (0, logger_1.default)("Fetch All Users", query, "Success", null, req);
        return records;
    }
    catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        (0, logger_1.default)("Fetch All Users", query, "Failed", error, req);
        throw error;
    }
};
exports.getAllUsers = getAllUsers;
// GET USER BY ID
const getUserById = async (id, req) => {
    const query = "SELECT id, fullname, email, mobile FROM TESTAPI WHERE id = @id";
    try {
        const [record] = await db_1.default.execute(query, { id });
        (0, logger_1.default)(`Fetch User ID ${id}`, query, "Success", null, req);
        return Array.isArray(record) && record.length > 0 ? record[0] : null;
    }
    catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        (0, logger_1.default)(`Fetch User ID ${id}`, query, "Failed", error, req);
        throw error;
    }
};
exports.getUserById = getUserById;
// ADD USER
const addUser = async (obj, req) => {
    const query = `
    INSERT INTO TESTAPI (id, fullname, email, mobile)
    VALUES (@id, @fullname, @email, @mobile)
  `;
    try {
        const [result] = await db_1.default.execute(query, obj);
        (0, logger_1.default)("Insert User", query, "Success", null, req);
        return result;
    }
    catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        (0, logger_1.default)("Insert User", query, "Failed", error, req);
        throw error;
    }
};
exports.addUser = addUser;
// EDIT USER (WITH TRANSACTION SERVICE)
const EditUser = async (obj, id, req) => {
    const trx = new transactionService_1.default();
    try {
        const conn = await trx.start();
        const checkQuery = "SELECT id FROM TESTAPI WHERE id = @id FOR UPDATE";
        const [existing] = await conn.query(checkQuery, { id });
        if (existing.length === 0) {
            throw new Error("User not found");
        }
        const query = `
      UPDATE TESTAPI
      SET fullname = @fullname, email = @email, mobile = @mobile
      WHERE id = @id
    `;
        const [result] = await conn.query(query, { ...obj, id });
        await trx.commit();
        (0, logger_1.default)(`Update User ID ${id}`, query, "Success", null, req);
        return result;
    }
    catch (err) {
        await trx.rollback();
        const error = err instanceof Error ? err : new Error("Unknown error");
        const query = `
      UPDATE TESTAPI
      SET fullname = @fullname, email = @email, mobile = @mobile
      WHERE id = @id
    `;
        (0, logger_1.default)(`Update User ID ${id}`, query, "Failed", error, req);
        throw error;
    }
};
exports.EditUser = EditUser;
// DELETE USER (WITH TRANSACTION SERVICE)
const deleteUserById = async (id, req) => {
    const trx = new transactionService_1.default();
    try {
        const conn = await trx.start();
        const checkQuery = "SELECT id FROM TESTAPI WHERE id = @id FOR UPDATE";
        const [existing] = await conn.query(checkQuery, { id });
        if (existing.length === 0) {
            throw new Error("User not found");
        }
        const query = "DELETE FROM TESTAPI WHERE id = @id";
        const [result] = await conn.query(query, { id });
        await trx.commit();
        (0, logger_1.default)(`Delete User ID ${id}`, query, "Success", null, req);
        return result;
    }
    catch (err) {
        await trx.rollback();
        const error = err instanceof Error ? err : new Error("Unknown error");
        const query = "DELETE FROM TESTAPI WHERE id = @id";
        (0, logger_1.default)(`Delete User ID ${id}`, query, "Failed", error, req);
        throw error;
    }
};
exports.deleteUserById = deleteUserById;
