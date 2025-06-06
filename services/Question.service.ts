import Question from "../models/Question.model"; // Make sure this is the correct Question model
import HttpError from "../utils/httpError";
import { CreateQuestionServiceParams, UpdateQuestionServiceParams } from "../utils/types"; // Import the updated types

// Create a new question associated with a Test (using testId)
export const createQuestionService = async (params: CreateQuestionServiceParams) => {
    try {
        // Ensure all required fields for a complete Question are passed
        const newQuestion = await Question.create({
            testId: params.testId,
            questionText: params.questionText, // Corrected from 'text' to 'questionText'
            options: params.options,
            correctAnswerIndex: params.correctAnswerIndex,
            points: params.points,
        });
        return newQuestion;
    } catch (error) {
        throw error;
    }
};

// Get a single question by its ID
export const getQuestionByIdService = async (id: string) => {
    try {
        const question = await Question.findByPk(id);
        if (!question) {
            throw new HttpError("Question not found", 404);
        }
        return question;
    } catch (error) {
        throw error;
    }
};

// Update an existing question
export const updateQuestionService = async (id: string, params: UpdateQuestionServiceParams) => {
    try {
        const question = await Question.findByPk(id); // Find the question first
        if (!question) {
            throw new HttpError("Question not found", 404);
        }

        // Update the question instance with the provided parameters
        // This will update only the fields present in 'params'
        await question.update(params);
        return { message: "Question updated successfully" };
    } catch (error) {
        throw error;
    }
};

// Delete a question
export const deleteQuestionService = async (id: string) => {
    try {
        const question = await Question.findByPk(id); // Find the question first
        if (!question) {
            throw new HttpError("Question not found", 404);
        }
        await question.destroy(); // Destroy the found instance
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
