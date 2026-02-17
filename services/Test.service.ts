import Test from "../models/Test.model";
import HttpError from "../utils/httpError";
import { Op } from 'sequelize';
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
            scheduledStartTime: params.scheduledStartTime ?? null,  // NEW
            scheduledEndTime: params.scheduledEndTime ?? null,      // NEW
            timerEnabled: params.timerEnabled ?? true,              // NEW
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

        const currentName = test.getDataValue('name');
        const currentTestSeriesId = test.getDataValue('testSeriesId');

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
                    id: { [Op.ne]: id }
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

export const checkTestScheduleService = (test: any): {
    accessible: boolean;
    reason?: string;
    timerEnabled: boolean;
} => {
    const now = new Date();
    const scheduledStartTime = test.getDataValue
        ? test.getDataValue('scheduledStartTime')
        : test.scheduledStartTime;
    const scheduledEndTime = test.getDataValue
        ? test.getDataValue('scheduledEndTime')
        : test.scheduledEndTime;
    const timerEnabled = test.getDataValue
        ? test.getDataValue('timerEnabled')
        : test.timerEnabled;

    if (scheduledStartTime && now < new Date(scheduledStartTime)) {
        return {
            accessible: false,
            timerEnabled: timerEnabled ?? true,
            reason: `This test will open at ${new Date(scheduledStartTime).toLocaleString()}`,
        };
    }

    if (scheduledEndTime && now > new Date(scheduledEndTime)) {
        return {
            accessible: false,
            timerEnabled: timerEnabled ?? true,
            reason: `This test window closed at ${new Date(scheduledEndTime).toLocaleString()}`,
        };
    }

    return { accessible: true, timerEnabled: timerEnabled ?? true };
};