import Question from "../models/Question.model";
import HttpError from "../utils/httpError";
import { CreateQuestionServiceParams, UpdateQuestionServiceParams } from "../utils/types";

export const createQuestionService = async (params: CreateQuestionServiceParams) => {
    try {
        const newQuestion = await Question.create({
            testSeriesId: params.testSeriesId,
            text: params.text, 
        });
        return newQuestion;
    } catch (error) {
        throw error;
    }
};

export const updateQuestionService = async (id: string, params: UpdateQuestionServiceParams) => {
    try {
        const question = await Question.findOne({ where: { id } });
        if (!question) {
            throw new HttpError("Question not found", 404);
        }
        await Question.update(params, { where: { id } });
        return { message: "Question updated successfully" };
    } catch (error) {
        throw error;
    }
};

export const deleteQuestionService = async (id: string) => {
    try {
        const question = await Question.findOne({ where: { id } });
        if (!question) {
            throw new HttpError("Question not found", 404);
        }
        await question.destroy();
        return { message: "Question deleted successfully" };
    } catch (error) {
        throw error;
    }
};

export const getQuestionsByTestSeriesService = async (testSeriesId: string) => {
    try {
        const questions = await Question.findAll({ where: { testSeriesId } });
        return questions;
    } catch (error) {
        throw error;
    }
};
