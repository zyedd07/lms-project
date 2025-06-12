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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// User.router.ts
const express_1 = __importDefault(require("express"));
const UserController = __importStar(require("../controllers/User.controller"));
const auth_1 = __importStar(require("../middleware/auth"));
const router = express_1.default.Router();
router.post('/create', UserController.createUser);
router.post('/login', UserController.loginUser);
// NEW: Endpoint to get the currently logged-in user's profile based on their token
router.get('/me', auth_1.default, UserController.getLoggedInUser); // <--- ADD THIS LINE
router.get('/:email', UserController.getUser);
// Consider if this route should be authenticated,
// e.g., router.get('/:email', isAuth, UserController.getUser);
// or if only admins can view other user profiles:
// router.get('/:email', isAuth, authorizeAdmin, UserController.getUser);
router.get('/', auth_1.default, auth_1.authorizeAdmin, UserController.getAllUsers);
router.put('/:id', auth_1.default, auth_1.authorizeAdmin, UserController.updateUser);
router.delete('/:id', auth_1.default, auth_1.authorizeAdmin, UserController.deleteUser);
exports.default = router;
