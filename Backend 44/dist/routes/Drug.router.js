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
const drugController = __importStar(require("../controllers/Drug.controller"));
const auth_1 = __importStar(require("../middleware/auth")); // Assuming auth middleware exists
const router = express_1.default.Router();
// --- Public Routes ---
/**
 * @route   GET /api/drugs
 * @desc    Get all drugs, grouped by the first letter of their name
 * @access  Public
 */
router.get('/', drugController.getAllDrugsGrouped);
/**
 * @route   GET /api/drugs/:drugId
 * @desc    Get a single drug by its ID
 * @access  Public
 */
router.get('/:drugId', drugController.getDrugById);
// --- Admin-only Routes ---
/**
 * @route   POST /api/drugs/create
 * @desc    Create a new drug
 * @access  Private (Admin)
 */
router.post('/create', auth_1.default, auth_1.authorizeAdmin, drugController.createDrug);
/**
 * @route   PUT /api/drugs/:drugId
 * @desc    Update an existing drug
 * @access  Private (Admin)
 */
router.put('/:drugId', auth_1.default, auth_1.authorizeAdmin, drugController.updateDrug);
/**
 * @route   DELETE /api/drugs/:drugId
 * @desc    Delete a drug
 * @access  Private (Admin)
 */
router.delete('/:drugId', auth_1.default, auth_1.authorizeAdmin, drugController.deleteDrug);
exports.default = router;
