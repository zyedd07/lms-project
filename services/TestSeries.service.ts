import TestSeries from "../models/TestSeries.model";
import HttpError from "../utils/httpError";
import User from "../models/User.model";
import { CreateTestSeriesServiceParams, UpdateTestSeriesServiceParams, TestSeriesData } from "../utils/types";

/**
 * Creates a new Test Series record in the database.
 */
export const createTestSeriesService = async (params: CreateTestSeriesServiceParams) => {
    try {
        if (!params.createdBy) {
            throw new HttpError("Creator ID is required to create a test series.", 400);
        }

        const existingTestSeries = await TestSeries.findOne({
            where: { name: params.name, createdBy: params.createdBy },
        });
        if (existingTestSeries) {
            throw new HttpError("Test Series already exists with the same name by this creator.", 400);
        }

        const newTestSeries = await TestSeries.create({
            name: params.name,
            description: params.description,
            price: params.price,
            thumbnailUrl: params.thumbnailUrl ?? null,   // ← new field
            createdBy: params.createdBy,
        });

        return newTestSeries.toJSON() as TestSeriesData;
    } catch (error) {
        throw error;
    }
};

/**
 * Updates an existing Test Series record in the database.
 */
export const updateTestSeriesService = async (id: string, params: UpdateTestSeriesServiceParams) => {
    try {
        const testSeries = await TestSeries.findOne({ where: { id } });
        if (!testSeries) {
            throw new HttpError("Test Series not found", 404);
        }

        // params may include thumbnailUrl — update() will handle it automatically
        await testSeries.update(params);

        const updatedTestSeries = await TestSeries.findByPk(id, {
            include: [{
                model: User,
                as: 'creator',
                attributes: ['id', 'name', 'email'],
            }],
        });

        if (!updatedTestSeries) {
            throw new HttpError("Failed to retrieve updated Test Series.", 500);
        }

        return updatedTestSeries.toJSON() as TestSeriesData;
    } catch (error) {
        throw error;
    }
};

/**
 * Retrieves all Test Series records, including creator information.
 */
export const getAllTestSeriesService = async (filter: any = {}): Promise<TestSeriesData[]> => {
    try {
        const testSeriesList = await TestSeries.findAll({
            where: filter,
            include: [{
                model: User,
                as: 'creator',
                required: false,
                attributes: ['id', 'name', 'email'],
            }],
        });
        return testSeriesList.map(ts => ts.toJSON() as TestSeriesData);
    } catch (error) {
        throw error;
    }
};

/**
 * Retrieves a single Test Series by ID, including creator information.
 */
export const getTestSeriesByIdService = async (id: string): Promise<TestSeriesData> => {
    try {
        const testSeries = await TestSeries.findByPk(id, {
            include: [{
                model: User,
                as: 'creator',
                required: false,
                attributes: ['id', 'name', 'email'],
            }],
        });

        if (!testSeries) {
            throw new HttpError("Test Series not found.", 404);
        }

        return testSeries.toJSON() as TestSeriesData;
    } catch (error) {
        throw error;
    }
};

/**
 * Deletes a Test Series record from the database.
 */
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