import Question from "../models/Question.model";
import HttpError from "../utils/httpError";
import { CreateQuestionServiceParams, UpdateQuestionServiceParams } from "../utils/types";

// Create a new question associated with a Test (using testId)
export const createQuestionService = async (params: CreateQuestionServiceParams) => {
    try {
        const newQuestion = await Question.create({
            testId: params.testId,
            text: params.questionText, 
        });
        return newQuestion;
    } catch (error) {
        throw error;
    }
};

// Update an existing question using questionText
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

// Delete a question
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

// Get all questions for a specific Test using testId
export const getQuestionsByTestService = async (testId: string) => {
    try {
        const questions = await Question.findAll({ where: { testId } });
        return questions;
    } catch (error) {
        throw error;
    }
};
