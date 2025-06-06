import Test from "../models/Test.model"; // Import your Test model
import HttpError from "../utils/httpError";
import { Op } from 'sequelize'; // Import Op from sequelize for queries
// Import the updated types from your types.ts file
import { CreateTestServiceParams, UpdateTestServiceParams } from "../utils/types";

export const createTestService = async (params: CreateTestServiceParams) => {
    try {
        const existingTest = await Test.findOne({
            where: { name: params.name, testSeriesId: params.testSeriesId },
        });
        if (existingTest) {
            throw new HttpError("A test with the same name already exists in this test series", 400);
        }

        const newTest = await Test.create({
            testSeriesId: params.testSeriesId,
            name: params.name,
            description: params.description,
            durationMinutes: params.durationMinutes,
            numberOfQuestions: params.numberOfQuestions,
            passMarkPercentage: params.passMarkPercentage,
            createdBy: params.createdBy,
        });
        return newTest;
    } catch (error) {
        throw error;
    }
};

export const getTestByIdService = async (id: string) => {
    try {
        const test = await Test.findByPk(id);
        if (!test) {
            throw new HttpError("Test not found", 404);
        }
        return test;
    } catch (error) {
        throw error;
    }
};

export const updateTestService = async (id: string, params: UpdateTestServiceParams) => {
    try {
        const test = await Test.findByPk(id);
        if (!test) {
            throw new HttpError("Test not found", 404);
        }

        // Optional: If 'name' or 'testSeriesId' are updated,
        // you might want to check for uniqueness within the new testSeriesId
        // Ensure params.name and params.testSeriesId are explicitly checked for existence
        // and that 'test' is correctly typed as a Test instance (which it is after findByPk)
        if (
            (params.name !== undefined && params.name !== test.name) ||
            (params.testSeriesId !== undefined && params.testSeriesId !== test.testSeriesId)
        ) {
            const existingTestWithNewName = await Test.findOne({
                where: {
                    name: params.name !== undefined ? params.name : test.name, // Use new name if provided, else old
                    testSeriesId: params.testSeriesId !== undefined ? params.testSeriesId : test.testSeriesId, // Use new testSeriesId if provided, else old
                    id: { [Op.ne]: id } // Use Op.ne directly from imported Op
                },
            });
            if (existingTestWithNewName) {
                throw new HttpError("A test with this name already exists in the target test series", 400);
            }
        }

        await test.update(params);
        return { message: "Test updated successfully" };
    } catch (error) {
        throw error;
    }
};

export const deleteTestService = async (id: string) => {
    try {
        const test = await Test.findByPk(id);
        if (!test) {
            throw new HttpError("Test not found", 404);
        }
        await test.destroy();
        return { message: "Test deleted successfully" };
    } catch (error) {
        throw error;
    }
};

export const getTestsByTestSeriesService = async (testSeriesId: string) => {
    try {
        const tests = await Test.findAll({ where: { testSeriesId } });
        return tests;
    } catch (error) {
        throw error;
    }
};