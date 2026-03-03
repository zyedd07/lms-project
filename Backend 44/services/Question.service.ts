import Question from "../models/Question.model";
import HttpError from "../utils/httpError";
import { CreateQuestionServiceParams, UpdateQuestionServiceParams } from "../utils/types";

export const createQuestionService = async (params: CreateQuestionServiceParams) => {
    try {
        const newQuestion = await Question.create({
            testId: params.testId,
            questionType: params.questionType ?? 'mcq',
            questionText: params.questionText,
            questionImageUrl: params.questionImageUrl ?? null,
            options: params.options ?? null,
            correctAnswerIndex: params.correctAnswerIndex ?? null,
            pairs: params.pairs ?? null,
            points: params.points,
            negativePoints: params.negativePoints,
            answerDescription: params.answerDescription ?? null,

        });
        return newQuestion;
    } catch (error) {
        throw error;
    }
};

export const getQuestionByIdService = async (id: string) => {
    try {
        const question = await Question.findByPk(id);
        if (!question) throw new HttpError("Question not found", 404);
        return question;
    } catch (error) {
        throw error;
    }
};

export const updateQuestionService = async (id: string, params: UpdateQuestionServiceParams) => {
    try {
        const question = await Question.findByPk(id);
        if (!question) throw new HttpError("Question not found", 404);
        await question.update(params);
        return { message: "Question updated successfully" };
    } catch (error) {
        throw error;
    }
};

export const deleteQuestionService = async (id: string) => {
    try {
        const question = await Question.findByPk(id);
        if (!question) throw new HttpError("Question not found", 404);
        await question.destroy();
        return { message: "Question deleted successfully" };
    } catch (error) {
        throw error;
    }
};

export const getQuestionsByTestService = async (testId: string) => {
    try {
        const questions = await Question.findAll({ where: { testId } });
        return questions;
    } catch (error) {
        throw error;
    }
};