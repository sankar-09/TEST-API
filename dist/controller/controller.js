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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Service = __importStar(require("../service/service"));
const router = express_1.default.Router();
// GET: /api/user
router.get("/", async (req, res) => {
    try {
        const users = await Service.getAllUsers(req);
        res.json(users);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "An error occurred while fetching users." });
    }
});
// GET: /api/user/:id
router.get("/:id", async (req, res) => {
    try {
        const user = await Service.getUserById(req.params.id, req);
        if (!user) {
            res
                .status(404)
                .json({ message: `No records found with given id: ${req.params.id}` });
        }
        else {
            res.json(user);
        }
    }
    catch (err) {
        console.error(err);
        res
            .status(500)
            .json({ error: "An error occurred while fetching the user." });
    }
});
// DELETE: /api/user/:id
router.delete("/:id", async (req, res) => {
    try {
        const result = await Service.deleteUserById(req.params.id, req);
        if (result.affectedRows === 0) {
            res
                .status(404)
                .json({ message: `No records found with given id: ${req.params.id}` });
        }
        else {
            res.status(200).json({ message: "Deleted successfully" });
        }
    }
    catch (err) {
        console.error(err);
        res
            .status(500)
            .json({ error: "An error occurred while deleting the user." });
    }
});
// INSERT: /api/user/
router.post("/", async (req, res) => {
    try {
        const result = await Service.addUser(req.body, req);
        res
            .status(201)
            .json({ message: "Inserted Successfully", userId: result.insertId });
    }
    catch (err) {
        console.error(err);
        res
            .status(500)
            .json({ error: "An error occurred while inserting the user." });
    }
});
// UPDATE: /api/user/:id
router.put("/:id", async (req, res) => {
    try {
        const result = await Service.EditUser(req.body, req.params.id, req);
        res.status(200).json({ message: "Updated Successfully" });
    }
    catch (err) {
        console.error(err);
        res
            .status(500)
            .json({ error: "An error occurred while updating the user." });
    }
});
exports.default = router;
