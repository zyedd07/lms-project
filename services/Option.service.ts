import Option from "../models/Option.model";
import HttpError from "../utils/httpError";
import { CreateOptionServiceParams, UpdateOptionServiceParams } from "../utils/types";

export const createOptionService = async (params: CreateOptionServiceParams) => {
    try {
        const count = await Option.count({ where: { questionId: params.questionId } });
        if (count >= 4) {
            throw new HttpError("Cannot add more than 4 options for a question", 400);
        }

        const newOption = await Option.create({
            questionId: params.questionId,
            text: params.text,
            isCorrect: params.isCorrect,
        });
        return newOption;
    } catch (error) {
        throw error;
    }
};

export const getOptionsByQuestionService = async (questionId: string) => {
    try {
        const options = await Option.findAll({ where: { questionId } });
        return options;
    } catch (error) {
        throw error;
    }
};

export const updateOptionService = async (id: string, params: UpdateOptionServiceParams) => {
    try {
        const option = await Option.findOne({ where: { id } });
        if (!option) {
            throw new HttpError("Option not found", 404);
        }
        await Option.update(params, { where: { id } });
        return { message: "Option updated successfully" };
    } catch (error) {
        throw error;
    }
};

export const deleteOptionService = async (id: string) => {
    try {
        const option = await Option.findOne({ where: { id } });
        if (!option) {
            throw new HttpError("Option not found", 404);
        }
        await option.destroy();
        return { message: "Option deleted successfully" };
    } catch (error) {
        throw error;
    }
};
