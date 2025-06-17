"use strict";
// src/controllers/companyController.ts
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
exports.deleteCompanyController = exports.updateCompanyController = exports.getAllCompaniesController = exports.getCompanyByIdController = exports.createCompanyController = void 0;
const httpError_1 = __importDefault(require("../utils/httpError"));
const constants_1 = require("../utils/constants");
const companyService_1 = require("../services/companyService");
const createCompanyController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (role !== constants_1.Role.ADMIN) {
            throw new httpError_1.default('Unauthorized: Only admins can create companies.', 403);
        }
        // Only destructure 'name'
        const { name } = req.body;
        if (!name) {
            throw new httpError_1.default('Please provide company name.', 400);
        }
        const newCompany = yield (0, companyService_1.createCompanyService)({
            name,
            // REMOVED: website, logoUrl, address
        });
        res.status(201).json({
            success: true,
            message: "Company created successfully.",
            data: newCompany
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createCompanyController = createCompanyController;
const getCompanyByIdController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            throw new httpError_1.default('Company ID is required in URL parameters.', 400);
        }
        const company = yield (0, companyService_1.getCompanyByIdService)(id);
        res.status(200).json({
            success: true,
            data: company
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getCompanyByIdController = getCompanyByIdController;
const getAllCompaniesController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // If you had query parameters for website, logoUrl, address, they'd be removed here
        const companies = yield (0, companyService_1.getAllCompaniesService)();
        res.status(200).json({
            success: true,
            data: companies
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllCompaniesController = getAllCompaniesController;
const updateCompanyController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (role !== constants_1.Role.ADMIN) {
            throw new httpError_1.default('Unauthorized: Only admins can update companies.', 403);
        }
        const { id } = req.params;
        // Only destructure 'name' for update
        const { name } = req.body;
        if (!id) {
            throw new httpError_1.default('Company ID is required in URL parameters.', 400);
        }
        // Check if 'name' is provided for update
        if (!name) {
            throw new httpError_1.default('Please provide company name to update.', 400);
        }
        const updatedCompany = yield (0, companyService_1.updateCompanyService)(id, {
            name,
            // REMOVED: website, logoUrl, address
        });
        res.status(200).json({
            success: true,
            message: "Company updated successfully.",
            data: updatedCompany
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateCompanyController = updateCompanyController;
const deleteCompanyController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (role !== constants_1.Role.ADMIN) {
            throw new httpError_1.default('Unauthorized: Only admins can delete companies.', 403);
        }
        const { id } = req.params;
        if (!id) {
            throw new httpError_1.default('Company ID is required in URL parameters.', 400);
        }
        const response = yield (0, companyService_1.deleteCompanyService)(id);
        res.status(200).json(Object.assign({ success: true }, response));
    }
    catch (error) {
        next(error);
    }
});
exports.deleteCompanyController = deleteCompanyController;
