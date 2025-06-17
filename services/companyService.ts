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

        // FIX FOR ERROR 1 (TS2345):
        // Ensure that the 'Optional' type in Company.model.ts correctly marks 'id',
        // 'createdAt', 'updatedAt' as optional. With that in place,
        // passing just { name: params.name } is correct for creation.
        const newCompany = await Company.create({
            name: params.name,
        });
        return newCompany;
    } catch (error) {
        throw error;
    }
};

export const getCompanyByIdService = async (id: string) => {
    try {
        const company = await Company.findByPk(id);
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
        const company = await Company.findByPk(id);
        if (!company) {
            throw new HttpError('Company not found', 404);
        }

        // FIX FOR ERROR 2 (TS2339):
        // Using 'company!.name' to explicitly tell TypeScript that 'company' is non-null here,
        // and that 'name' property is expected to exist on it.
        // While the 'if (!company)' check *should* narrow the type, sometimes with complex
        // generics like Sequelize models, TypeScript needs this hint.
        if (params.name && params.name !== company!.name) {
            const existingCompanyWithName = await Company.findOne({
                where: { name: params.name },
            });
            if (existingCompanyWithName && existingCompanyWithName.id !== id) {
                throw new HttpError("Company with this name already exists", 400);
            }
        }

        if (params.name !== undefined) {
            await company.update({ name: params.name });
        }

        const updatedCompany = await Company.findByPk(id);
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