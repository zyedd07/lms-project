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
exports.deleteTermsSection = exports.updateTermsSection = exports.createTermsSection = exports.getAllTermsSections = void 0;
const TermsSectionService = __importStar(require("../services/TermsSection.service"));
const httpError_1 = __importDefault(require("../utils/httpError"));
/**
 * Controller to get all Terms of Service sections.
 */
const getAllTermsSections = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sections = yield TermsSectionService.getAllTermsSectionsService();
        res.status(200).json({ success: true, data: sections });
    }
    catch (error) {
        next(new httpError_1.default('Failed to fetch Terms of Service sections', 500));
    }
});
exports.getAllTermsSections = getAllTermsSections;
/**
 * Controller to create a new Terms of Service section.
 */
const createTermsSection = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, content, order } = req.body;
        if (!title || !content) {
            throw new httpError_1.default('Title and content are required fields.', 400);
        }
        const newSection = yield TermsSectionService.createTermsSectionService({ title, content, order });
        res.status(201).json({ success: true, message: 'Terms of Service section created successfully', data: newSection });
    }
    catch (error) {
        next(error);
    }
});
exports.createTermsSection = createTermsSection;
/**
 * Controller to update a Terms of Service section.
 */
const updateTermsSection = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sectionId = parseInt(req.params.id, 10);
        if (isNaN(sectionId)) {
            throw new httpError_1.default('Invalid section ID.', 400);
        }
        const updatedSection = yield TermsSectionService.updateTermsSectionService(sectionId, req.body);
        res.status(200).json({ success: true, message: 'Terms of Service section updated successfully', data: updatedSection });
    }
    catch (error) {
        next(error);
    }
});
exports.updateTermsSection = updateTermsSection;
/**
 * Controller to delete a Terms of Service section.
 */
const deleteTermsSection = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sectionId = parseInt(req.params.id, 10);
        if (isNaN(sectionId)) {
            throw new httpError_1.default('Invalid section ID.', 400);
        }
        yield TermsSectionService.deleteTermsSectionService(sectionId);
        res.status(200).json({ success: true, message: 'Terms of Service section deleted successfully' });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteTermsSection = deleteTermsSection;
