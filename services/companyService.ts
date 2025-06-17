// src/services/companyService.ts

import Company from "../models/Company.model";
import HttpError from "../utils/httpError";
import { CreateCompanyServiceParams, UpdateCompanyServiceParams } from "../utils/types";

export const createCompanyService = async (params: CreateCompanyServiceParams) => {
    try {
        const existingCompany = await Company.findOne({
            where: { name: params.name },
        });
        if (existingCompany) {
            throw new HttpError("Company with this name already exists", 400);
        }

        const newCompany = await Company.create({
            name: params.name,
            website: params.website,
            logoUrl: params.logoUrl,
            address: params.address,
        });
        return newCompany;
    } catch (error) {
        throw error;
    }
};

export const getCompanyByIdService = async (id: string) => {
    try {
        // Explicitly cast the result to Company
        const company = await Company.findByPk(id) as Company; // Fix: Add as Company
        if (!company) {
            throw new HttpError("Company not found", 404);
        }
        return company;
    } catch (error) {
        throw error;
    }
};

export const getAllCompaniesService = async () => {
    try {
        const companies = await Company.findAll();
        return companies;
    } catch (error) {
        throw error;
    }
};

export const updateCompanyService = async (id: string, params: UpdateCompanyServiceParams) => {
    try {
        // Explicitly cast the result to Company
        const company = await Company.findByPk(id) as Company; // Fix: Add as Company
        if (!company) {
            throw new HttpError('Company not found', 404);
        }

        // Fix: company is now typed as Company, so 'name' is accessible
        if (params.name && params.name !== company.name) {
            const existingCompanyWithName = await Company.findOne({
                where: { name: params.name },
            });
            if (existingCompanyWithName) {
                throw new HttpError("Company with this name already exists", 400);
            }
        }

        await company.update(params);
        // Explicitly cast the result to Company
        const updatedCompany = await Company.findByPk(id) as Company; // Fix: Add as Company
        return updatedCompany;
    } catch (error) {
        throw error;
    }
};

export const deleteCompanyService = async (id: string) => {
    try {
        const deletedRows = await Company.destroy({
            where: { id: id }
        });
        if (deletedRows === 0) {
            throw new HttpError('Company not found', 404);
        }
        return { message: 'Company deleted successfully' };
    } catch (error) {
        throw error;
    }
};