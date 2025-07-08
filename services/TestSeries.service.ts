import TestSeries from "../models/TestSeries.model";
import HttpError from "../utils/httpError";
import User from "../models/User.model"; // Import the User model
import { CreateTestSeriesServiceParams, UpdateTestSeriesServiceParams, TestSeriesData } from "../utils/types"; // Assuming TestSeriesData is defined and will include 'creator'

/**
 * Creates a new Test Series record in the database.
 * @param params - Contains all necessary data for creating a test series, including the price and createdBy (uploaderId).
 * @returns A Promise that resolves to the created TestSeriesData.
 * @throws HttpError if required parameters are missing or if a unique constraint is violated.
 */
export const createTestSeriesService = async (params: CreateTestSeriesServiceParams) => {
    try {
        // FIX: Ensure createdBy is present for creation
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
            createdBy: params.createdBy, // Assign the createdBy (uploader) ID
        });

        // FIX: Return the created test series as plain data, potentially including creator if needed by controller
        // For consistency, services often return plain data
        return newTestSeries.toJSON() as TestSeriesData;
    } catch (error) {
        throw error;
    }
};

/**
 * Updates an existing Test Series record in the database.
 * @param id - The ID of the test series to update.
 * @param params - An object containing the fields to update.
 * @returns A Promise that resolves with a success message.
 * @throws HttpError if the test series is not found.
 */
export const updateTestSeriesService = async (id: string, params: UpdateTestSeriesServiceParams) => {
    try {
        const testSeries = await TestSeries.findOne({
            where: { id },
        });
        if (!testSeries) {
            throw new HttpError("Test Series not found", 404);
        }

        // Update all provided parameters, including price if it exists in params
        await testSeries.update(params); // Use instance update for better type inference and hooks

        // FIX: Fetch the updated test series with creator information to return
        const updatedTestSeries = await TestSeries.findByPk(id, {
            include: [{
                model: User,
                as: 'creator', // This alias must match the 'as' in your TestSeries model association
                attributes: ['id', 'name', 'email'] // Select specific user attributes
            }]
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
 * Retrieves all Test Series records from the database, including creator information.
 * @param filter - Optional filter object for the query.
 * @returns A Promise that resolves to an array of TestSeriesData.
 */
export const getAllTestSeriesService = async (filter: any = {}): Promise<TestSeriesData[]> => {
    try {
        // FIX: Include the User model for creator information
        const testSeriesList = await TestSeries.findAll({
            where: filter,
            include: [{
                model: User,
                as: 'creator', // This alias must match the 'as' in your TestSeries model association
                required: false, // Set to true if a TestSeries MUST have a creator
                attributes: ['id', 'name', 'email'] // Select specific user attributes
            }]
        });
        return testSeriesList.map(ts => ts.toJSON() as TestSeriesData);
    } catch (error) {
        throw error;
    }
};

/**
 * Retrieves a single Test Series record by its ID, including creator information.
 * @param id - The ID of the test series to retrieve.
 * @returns A Promise that resolves to the TestSeriesData.
 * @throws HttpError if the test series is not found.
 */
export const getTestSeriesByIdService = async (id: string): Promise<TestSeriesData> => {
    try {
        // FIX: Include the User model for creator information
        const testSeries = await TestSeries.findByPk(id, {
            include: [{
                model: User,
                as: 'creator', // This alias must match the 'as' in your TestSeries model association
                required: false,
                attributes: ['id', 'name', 'email']
            }]
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
 * @param id - The ID of the test series to delete.
 * @returns A Promise that resolves with a success message.
 * @throws HttpError if the test series is not found.
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
