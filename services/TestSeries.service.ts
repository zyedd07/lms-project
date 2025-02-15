import TestSeries from "../models/TestSeries.model";
import HttpError from "../utils/httpError";
import { CreateTestSeriesServiceParams, UpdateTestSeriesServiceParams } from "../utils/types";


export const createTestSeriesService = async (params: CreateTestSeriesServiceParams) => {
    try {
        const existingTestSeries = await TestSeries.findOne({
            where: { name: params.name, createdBy: params.createdBy },
        });
        if (existingTestSeries) {
            throw new HttpError("Test Series already exists with the same name", 400);
        }

        const newTestSeries = await TestSeries.create({
            name: params.name,
            description: params.description,
            createdBy: params.createdBy,
        });

        return newTestSeries;
    } catch (error) {
        throw error;
    }
};


export const updateTestSeriesService = async (id: string, params: UpdateTestSeriesServiceParams) => {
    try {
        const testSeries = await TestSeries.findOne({
            where: { id },
        });
        if (!testSeries) {
            throw new HttpError("Test Series not found", 404);
        }
        await TestSeries.update(params, { where: { id } });
        return { message: "Test Series updated successfully" };
    } catch (error) {
        throw error;
    }
};


export const getAllTestSeriesService = async (filter: any = {}) => {
    try {
        const testSeriesList = await TestSeries.findAll({ where: filter });
        return testSeriesList;
    } catch (error) {
        throw error;
    }
};



export const deleteTestSeriesService = async (id: string) => {
    try {
        const testSeries = await TestSeries.findOne({ where: { id } });
        if (!testSeries) {
            throw new HttpError("Test Series not found", 404);
        }
        await testSeries.destroy();
        return { message: "Test Series deleted successfully" };
    } catch (error) {
        throw error;
    }
};
