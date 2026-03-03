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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDrug = exports.updateDrug = exports.getDrugById = exports.getAllDrugsGrouped = exports.createDrug = void 0;
const drugService = __importStar(require("../services/Drug.service"));
const httpError_1 = __importDefault(require("../utils/httpError"));
/**
 * @description Controller to create a new drug.
 */
const createDrug = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const params = req.body;
        if (!params.name || !params.categoryId || !params.details) {
            throw new httpError_1.default("Name, categoryId, and details are required fields.", 400);
        }
        const newDrug = yield drugService.createDrugService(params);
        res.status(201).json({
            success: true,
            message: "Drug created successfully.",
            data: newDrug
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createDrug = createDrug;
/**
 * @description Controller to get all drugs, grouped by the first letter.
 */
const getAllDrugsGrouped = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const groupedDrugs = yield drugService.getAllDrugsGroupedService();
        res.status(200).json({
            success: true,
            message: "Drugs fetched and grouped successfully.",
            data: groupedDrugs
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllDrugsGrouped = getAllDrugsGrouped;
/**
 * @description Controller to get a single drug by its ID.
 */
const getDrugById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { drugId } = req.params;
        if (!drugId) {
            throw new httpError_1.default("Drug ID is required.", 400);
        }
        const drug = yield drugService.getDrugByIdService(drugId);
        res.status(200).json({
            success: true,
            message: "Drug details fetched successfully.",
            data: drug
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getDrugById = getDrugById;
/**
 * @description Controller to update an existing drug.
 */
const updateDrug = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { drugId } = req.params;
        const params = req.body;
        if (!drugId) {
            throw new httpError_1.default("Drug ID is required.", 400);
        }
        if (Object.keys(params).length === 0) {
            throw new httpError_1.default("No update data provided.", 400);
        }
        const updatedDrug = yield drugService.updateDrugService(drugId, params);
        res.status(200).json({
            success: true,
            message: "Drug updated successfully.",
            data: updatedDrug
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateDrug = updateDrug;
/**
 * @description Controller to delete a drug.
 */
const deleteDrug = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { drugId } = req.params;
        if (!drugId) {
            throw new httpError_1.default("Drug ID is required.", 400);
        }
        const result = yield drugService.deleteDrugService(drugId);
        res.status(200).json({
            success: true,
            message: result.message
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteDrug = deleteDrug;
