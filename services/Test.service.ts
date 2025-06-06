import Test from "../models/Test.model"; // Import your Test model
import HttpError from "../utils/httpError";
// Import the updated types from your types.ts file
import { CreateTestServiceParams, UpdateTestServiceParams } from "../utils/types";

export const createTestService = async (params: CreateTestServiceParams) => {
    try {
        // Optional: Check if a test with the same name already exists within the same testSeriesId
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
            // --- ADDED NEW FIELDS ---
            durationMinutes: params.durationMinutes,
            numberOfQuestions: params.numberOfQuestions,
            passMarkPercentage: params.passMarkPercentage,
            createdBy: params.createdBy,
            // --- END ADDED NEW FIELDS ---
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

export const updateTestService = async (id: string, params: UpdateTestServiceParams) => { // Changed type to UpdateTestServiceParams
    try {
        const test = await Test.findByPk(id);
        if (!test) {
            throw new HttpError("Test not found", 404);
        }

        // Optional: If 'name' or 'testSeriesId' are updated,
        // you might want to check for uniqueness within the new testSeriesId
        if (params.name && params.testSeriesId && (params.name !== test.name || params.testSeriesId !== test.testSeriesId)) {
             const existingTestWithNewName = await Test.findOne({
                where: {
                    name: params.name,
                    testSeriesId: params.testSeriesId,
                    id: { [Test.sequelize.Op.ne]: id } // Exclude current test from check
                },
            });
            if (existingTestWithNewName) {
                throw new HttpError("A test with this name already exists in the target test series", 400);
            }
        }


        await test.update(params); // Update all provided parameters
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
