"use strict";
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
exports.deleteDrugService = exports.updateDrugService = exports.getDrugByIdService = exports.getAllDrugsGroupedService = exports.createDrugService = void 0;
const Drug_model_1 = __importDefault(require("../models/Drug.model"));
const DrugCategory_model_1 = __importDefault(require("../models/DrugCategory.model"));
const httpError_1 = __importDefault(require("../utils/httpError"));
/**
 * @description Create a new drug entry.
 * @param {CreateDrugParams} params - The data for the new drug.
 * @returns {Promise<Drug>} The created drug instance.
 */
const createDrugService = (params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Ensure the category exists before creating the drug
        const category = yield DrugCategory_model_1.default.findByPk(params.categoryId);
        if (!category) {
            throw new httpError_1.default("The specified category does not exist.", 400);
        }
        const newDrug = yield Drug_model_1.default.create(params);
        return newDrug;
    }
    catch (error) {
        if (error instanceof httpError_1.default)
            throw error;
        console.error("Error creating drug:", error);
        throw new httpError_1.default("Failed to create drug.", 500);
    }
});
exports.createDrugService = createDrugService;
/**
 * @description Get a list of all drugs, grouped by the first letter of their name (A-Z).
 * @returns {Promise<object>} An object where keys are letters and values are arrays of drugs.
 */
const getAllDrugsGroupedService = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const drugs = yield Drug_model_1.default.findAll({
            order: [['name', 'ASC']],
            include: [{ model: DrugCategory_model_1.default, as: 'category', attributes: ['name'] }]
        });
        // Group drugs by the first letter of their name
        const groupedDrugs = drugs.reduce((acc, drug) => {
            const firstLetter = drug.name.charAt(0).toUpperCase();
            if (!acc[firstLetter]) {
                acc[firstLetter] = [];
            }
            acc[firstLetter].push(drug);
            return acc;
        }, {});
        return groupedDrugs;
    }
    catch (error) {
        console.error("Error fetching and grouping drugs:", error);
        throw new httpError_1.default("Failed to fetch drugs.", 500);
    }
});
exports.getAllDrugsGroupedService = getAllDrugsGroupedService;
/**
 * @description Get a single drug by its ID, including category details.
 * @param {string} drugId - The ID of the drug.
 * @returns {Promise<Drug>} The drug instance.
 */
const getDrugByIdService = (drugId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const drug = yield Drug_model_1.default.findByPk(drugId, {
            include: [{ model: DrugCategory_model_1.default, as: 'category', attributes: ['id', 'name'] }]
        });
        if (!drug) {
            throw new httpError_1.default("Drug not found.", 404);
        }
        return drug;
    }
    catch (error) {
        if (error instanceof httpError_1.default)
            throw error;
        console.error("Error fetching drug by ID:", error);
        throw new httpError_1.default("Failed to fetch drug.", 500);
    }
});
exports.getDrugByIdService = getDrugByIdService;
/**
 * @description Update an existing drug entry.
 * @param {string} drugId - The ID of the drug to update.
 * @param {UpdateDrugParams} params - The fields to update.
 * @returns {Promise<Drug>} The updated drug instance.
 */
const updateDrugService = (drugId, params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const drug = yield (0, exports.getDrugByIdService)(drugId); // Reuse getById to check existence
        // If categoryId is being updated, ensure the new category exists
        if (params.categoryId) {
            const category = yield DrugCategory_model_1.default.findByPk(params.categoryId);
            if (!category) {
                throw new httpError_1.default("The specified category for update does not exist.", 400);
            }
        }
        const updatedDrug = yield drug.update(params);
        return updatedDrug;
    }
    catch (error) {
        if (error instanceof httpError_1.default)
            throw error;
        console.error("Error updating drug:", error);
        throw new httpError_1.default("Failed to update drug.", 500);
    }
});
exports.updateDrugService = updateDrugService;
/**
 * @description Delete a drug entry.
 * @param {string} drugId - The ID of the drug to delete.
 * @returns {Promise<{ message: string }>} A success message.
 */
const deleteDrugService = (drugId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const drug = yield (0, exports.getDrugByIdService)(drugId); // Reuse getById to check existence
        yield drug.destroy();
        return { message: "Drug deleted successfully." };
    }
    catch (error) {
        if (error instanceof httpError_1.default)
            throw error;
        console.error("Error deleting drug:", error);
        throw new httpError_1.default("Failed to delete drug.", 500);
    }
});
exports.deleteDrugService = deleteDrugService;
