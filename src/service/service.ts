import db from "../db";
import logTransaction from "../logger";
import { Request } from "express";

interface QueryResult {
  insertId?: number;
  affectedRows?: number;
}

export const getAllUsers = async (req?: Request) => {
  const query = "SELECT * FROM TESTAPI";
  try {
    const [records] = await db.execute(query);
    logTransaction("Fetch All Users", query, "Success", null, req);
    return records;
  } catch (err) {
    logTransaction("Fetch All Users", query, "Failed", err, req);
    throw err;
  }
};

export const getUserById = async (id: string, req?: Request) => {
  const query = "SELECT * FROM TESTAPI WHERE id = ?";
  try {
    const [record] = await db.execute(query, [id]);
    logTransaction(`Fetch User ID ${id}`, query, "Success", null, req);
    if (Array.isArray(record) && record.length > 0) {
      return record[0];
    } else {
      return null;
    }
  } catch (err) {
    logTransaction(`Fetch User ID ${id}`, query, "Failed", err, req);
    throw err;
  }
};

export const addUser = async (
  obj: {id: string; fullname: string; email: string; mobile: string },
  req?: Request
): Promise<QueryResult> => {
  const query = "INSERT INTO TESTAPI (id, fullname, email, mobile) VALUES (?, ?, ?, ?)";
  try {
    const [result] = await db.execute(query, [
      obj.id,
      obj.fullname,
      obj.email,
      obj.mobile,
    ]);
    logTransaction("Insert User", query, "Success", null, req);
    return result as QueryResult;
  } catch (err) {
    logTransaction("Insert User", query, "Failed", err, req);
    throw err;
  }
};

export const EditUser = async (
  obj: { fullname: string; email: string; mobile: string },
  id: string,
  req?: Request
): Promise<QueryResult> => {
  const query =
    "UPDATE TESTAPI SET fullname = ?, email = ?, mobile = ? WHERE id = ?";
  try {
    const [result] = await db.execute(query, [
      obj.fullname,
      obj.email,
      obj.mobile,
      id,
    ]);
    logTransaction(`Update User ID ${id}`, query, "Success", null, req);
    return result as QueryResult;
  } catch (err) {
    logTransaction(`Update User ID ${id}`, query, "Failed", err, req);
    throw err;
  }
};

export const deleteUserById = async (
  id: string,
  req?: Request
): Promise<QueryResult> => {
  const query = "DELETE FROM TESTAPI WHERE id = ?";
  try {
    const [result] = await db.execute(query, [id]);
    logTransaction(`Delete User ID ${id}`, query, "Success", null, req);
    return result as QueryResult;
  } catch (err) {
    logTransaction(`Delete User ID ${id}`, query, "Failed", err, req);
    throw err;
  }
};
