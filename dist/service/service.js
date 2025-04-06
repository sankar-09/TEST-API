"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserById = exports.EditUser = exports.addUser = exports.getUserById = exports.getAllUsers = void 0;
const db_1 = __importDefault(require("../db"));
const logger_1 = __importDefault(require("../logger"));
const getAllUsers = async (req) => {
    const query = "SELECT * FROM TESTAPI";
    try {
        const [records] = await db_1.default.execute(query);
        (0, logger_1.default)("Fetch All Users", query, "Success", null, req);
        return records;
    }
    catch (err) {
        (0, logger_1.default)("Fetch All Users", query, "Failed", err, req);
        throw err;
    }
};
exports.getAllUsers = getAllUsers;
const getUserById = async (id, req) => {
    const query = "SELECT * FROM TESTAPI WHERE id = ?";
    try {
        const [record] = await db_1.default.execute(query, [id]);
        (0, logger_1.default)(`Fetch User ID ${id}`, query, "Success", null, req);
        if (Array.isArray(record) && record.length > 0) {
            return record[0];
        }
        else {
            return null;
        }
    }
    catch (err) {
        (0, logger_1.default)(`Fetch User ID ${id}`, query, "Failed", err, req);
        throw err;
    }
};
exports.getUserById = getUserById;
const addUser = async (obj, req) => {
    const query = "INSERT INTO TESTAPI (id, fullname, email, mobile) VALUES (?, ?, ?, ?)";
    try {
        const [result] = await db_1.default.execute(query, [
            obj.id,
            obj.fullname,
            obj.email,
            obj.mobile,
        ]);
        (0, logger_1.default)("Insert User", query, "Success", null, req);
        return result;
    }
    catch (err) {
        (0, logger_1.default)("Insert User", query, "Failed", err, req);
        throw err;
    }
};
exports.addUser = addUser;
const EditUser = async (obj, id, req) => {
    const query = "UPDATE TESTAPI SET fullname = ?, email = ?, mobile = ? WHERE id = ?";
    try {
        const [result] = await db_1.default.execute(query, [
            obj.fullname,
            obj.email,
            obj.mobile,
            id,
        ]);
        (0, logger_1.default)(`Update User ID ${id}`, query, "Success", null, req);
        return result;
    }
    catch (err) {
        (0, logger_1.default)(`Update User ID ${id}`, query, "Failed", err, req);
        throw err;
    }
};
exports.EditUser = EditUser;
const deleteUserById = async (id, req) => {
    const query = "DELETE FROM TESTAPI WHERE id = ?";
    try {
        const [result] = await db_1.default.execute(query, [id]);
        (0, logger_1.default)(`Delete User ID ${id}`, query, "Success", null, req);
        return result;
    }
    catch (err) {
        (0, logger_1.default)(`Delete User ID ${id}`, query, "Failed", err, req);
        throw err;
    }
};
exports.deleteUserById = deleteUserById;
