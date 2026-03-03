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
exports.deleteTermsSectionService = exports.updateTermsSectionService = exports.createTermsSectionService = exports.getAllTermsSectionsService = void 0;
const TermsOfService_model_1 = __importDefault(require("../models/TermsOfService.model")); // Ensure the path is correct
const httpError_1 = __importDefault(require("../utils/httpError"));
/**
 * Service to get all Terms of Service sections, ordered correctly.
 */
const getAllTermsSectionsService = () => __awaiter(void 0, void 0, void 0, function* () {
    return TermsOfService_model_1.default.findAll({
        order: [['order', 'ASC']],
    });
});
exports.getAllTermsSectionsService = getAllTermsSectionsService;
/**
 * Service to create a new Terms of Service section.
 */
const createTermsSectionService = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, content, order } = params;
    // The 'as any' cast is a common workaround when using sequelize.define without a class
    const newSection = yield TermsOfService_model_1.default.create({ title, content, order });
    return newSection;
});
exports.createTermsSectionService = createTermsSectionService;
/**
 * Service to update an existing Terms of Service section by its ID.
 */
const updateTermsSectionService = (id, updates) => __awaiter(void 0, void 0, void 0, function* () {
    const section = yield TermsOfService_model_1.default.findByPk(id);
    if (!section) {
        throw new httpError_1.default('Terms of Service section not found', 404);
    }
    yield section.update(updates);
    return section;
});
exports.updateTermsSectionService = updateTermsSectionService;
/**
 * Service to delete a Terms of Service section by its ID.
 */
const deleteTermsSectionService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const section = yield TermsOfService_model_1.default.findByPk(id);
    if (!section) {
        throw new httpError_1.default('Terms of Service section not found', 404);
    }
    yield section.destroy();
    return true;
});
exports.deleteTermsSectionService = deleteTermsSectionService;
