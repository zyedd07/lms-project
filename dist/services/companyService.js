"use strict";
// src/services/companyService.ts
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
exports.deleteCompanyService = exports.updateCompanyService = exports.getAllCompaniesService = exports.getCompanyByIdService = exports.createCompanyService = void 0;
const Company_model_1 = __importDefault(require("../models/Company.model"));
const httpError_1 = __importDefault(require("../utils/httpError"));
const createCompanyService = (params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const existingCompany = yield Company_model_1.default.findOne({
            where: { name: params.name },
        });
        if (existingCompany) {
            throw new httpError_1.default("Company with this name already exists", 400);
        }
        const newCompany = yield Company_model_1.default.create({
            name: params.name,
            website: params.website,
            logoUrl: params.logoUrl,
            address: params.address,
        });
        return newCompany;
    }
    catch (error) {
        throw error;
    }
});
exports.createCompanyService = createCompanyService;
const getCompanyByIdService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Explicitly cast the result to Company
        const company = yield Company_model_1.default.findByPk(id); // Fix: Add as Company
        if (!company) {
            throw new httpError_1.default("Company not found", 404);
        }
        return company;
    }
    catch (error) {
        throw error;
    }
});
exports.getCompanyByIdService = getCompanyByIdService;
const getAllCompaniesService = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const companies = yield Company_model_1.default.findAll();
        return companies;
    }
    catch (error) {
        throw error;
    }
});
exports.getAllCompaniesService = getAllCompaniesService;
const updateCompanyService = (id, params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Explicitly cast the result to Company
        const company = yield Company_model_1.default.findByPk(id); // Fix: Add as Company
        if (!company) {
            throw new httpError_1.default('Company not found', 404);
        }
        // Fix: company is now typed as Company, so 'name' is accessible
        if (params.name && params.name !== company.name) {
            const existingCompanyWithName = yield Company_model_1.default.findOne({
                where: { name: params.name },
            });
            if (existingCompanyWithName) {
                throw new httpError_1.default("Company with this name already exists", 400);
            }
        }
        yield company.update(params);
        // Explicitly cast the result to Company
        const updatedCompany = yield Company_model_1.default.findByPk(id); // Fix: Add as Company
        return updatedCompany;
    }
    catch (error) {
        throw error;
    }
});
exports.updateCompanyService = updateCompanyService;
const deleteCompanyService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletedRows = yield Company_model_1.default.destroy({
            where: { id: id }
        });
        if (deletedRows === 0) {
            throw new httpError_1.default('Company not found', 404);
        }
        return { message: 'Company deleted successfully' };
    }
    catch (error) {
        throw error;
    }
});
exports.deleteCompanyService = deleteCompanyService;
