import Test from "../models/Test.model";
import HttpError from "../utils/httpError";

export interface CreateTestServiceParams {
  testSeriesId: string;
  name: string;
  description?: string;
}

export const createTestService = async (params: CreateTestServiceParams) => {
  try {
    const newTest = await Test.create({
      testSeriesId: params.testSeriesId,
      name: params.name,
      description: params.description,
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

export const updateTestService = async (id: string, params: Partial<CreateTestServiceParams>) => {
  try {
    const test = await Test.findByPk(id);
    if (!test) {
      throw new HttpError("Test not found", 404);
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
