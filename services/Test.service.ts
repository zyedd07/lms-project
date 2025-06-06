import Test from "../models/Test.model";
import HttpError from "../utils/httpError";
import { Op } from 'sequelize'; // Ensure Op is imported from sequelize
import { CreateTestServiceParams, UpdateTestServiceParams } from "../utils/types";

// Assume these types are correctly defined in ../utils/types.ts
// For example:
// export interface CreateTestServiceParams {
//   testSeriesId: string;
//   name: string;
//   description?: string;
//   durationMinutes: number;
//   numberOfQuestions: number;
//   passMarkPercentage: number;
//   createdBy: string;
// }
//
// export type UpdateTestServiceParams = Partial<Omit<CreateTestServiceParams, 'createdBy'>>;
// (You might also want to exclude 'testSeriesId' if it's never meant to be updated, but currently it is in params)

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

        // To address TS2339: Property 'name' does not exist on type 'Model<any, any>'.
        // Ensure test.name and test.testSeriesId are treated as strings.
        // We can assert 'test' as a specific type if needed, or simply check existence of params properties.
        const currentName = test.getDataValue('name'); // Safely get current name
        const currentTestSeriesId = test.getDataValue('testSeriesId'); // Safely get current testSeriesId

        // Check if 'name' or 'testSeriesId' are provided in params AND if they are different from current values
        if (
            (params.name !== undefined && params.name !== currentName) ||
            (params.testSeriesId !== undefined && params.testSeriesId !== currentTestSeriesId)
        ) {
            const targetName = params.name !== undefined ? params.name : currentName;
            const targetTestSeriesId = params.testSeriesId !== undefined ? params.testSeriesId : currentTestSeriesId;

            const existingTestWithNewName = await Test.findOne({
                where: {
                    name: targetName,
                    testSeriesId: targetTestSeriesId,
                    id: { [Op.ne]: id } // Exclude current test from check
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