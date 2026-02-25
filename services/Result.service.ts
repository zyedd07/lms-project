// services/Result.service.ts

import Result from "../models/Result.model";
import Test from "../models/Test.model";
import User from "../models/User.model";
import Question from "../models/Question.model";
import HttpError from "../utils/httpError";
import { CreateResultParams } from "../utils/types";
import { sequelize } from "../models";

export const createResultService = async (params: CreateResultParams) => {
    try {
        // Verify test exists
        const test = await Test.findByPk(params.testId);
        if (!test) {
            throw new HttpError("Test not found", 404);
        }

        // Verify user exists
        const user = await User.findByPk(params.userId);
        if (!user) {
            throw new HttpError("User not found", 404);
        }

        // Calculate percentage score
        const percentageScore = params.totalPossiblePoints > 0 
            ? (params.score / params.totalPossiblePoints) * 100 
            : 0;

        // Create result
        const result = await Result.create({
            userId: params.userId,
            testId: params.testId,
            score: params.score,
            totalPossiblePoints: params.totalPossiblePoints,
            correctCount: params.correctCount,
            incorrectCount: params.incorrectCount,
            skippedCount: params.skippedCount,
            totalQuestions: params.totalQuestions,
            percentageScore: percentageScore,
            hasPassed: params.hasPassed,
            timeTaken: params.timeTaken,
            userAnswers: params.userAnswers,
            completedAt: new Date(),
        });

        return result;
    } catch (error) {
        throw error;
    }
};

export const getResultByIdService = async (id: string) => {
    try {
        const result = await Result.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Test,
                    as: 'test',
                    attributes: ['id', 'name', 'description', 'durationMinutes', 'passMarkPercentage']
                }
            ]
        });

        if (!result) {
            throw new HttpError("Result not found", 404);
        }

        return result;
    } catch (error) {
        throw error;
    }
};

export const getResultsByUserService = async (userId: string) => {
    try {
        const results = await Result.findAll({
            where: { userId },
            include: [
                {
                    model: Test,
                    as: 'test',
                    attributes: ['id', 'name', 'description', 'durationMinutes', 'passMarkPercentage']
                }
            ],
            order: [['completedAt', 'DESC']]
        });

        return results;
    } catch (error) {
        throw error;
    }
};

export const getResultsByTestService = async (testId: string) => {
    try {
        const results = await Result.findAll({
            where: { testId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                }
            ],
            order: [['completedAt', 'DESC']]
        });

        return results;
    } catch (error) {
        throw error;
    }
};

export const getAllResultsService = async () => {
    try {
        const results = await Result.findAll({
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Test,
                    as: 'test',
                    attributes: ['id', 'name', 'description']
                }
            ],
            order: [['completedAt', 'DESC']]
        });

        return results;
    } catch (error) {
        throw error;
    }
};

export const deleteResultService = async (id: string) => {
    try {
        const result = await Result.findByPk(id);
        if (!result) {
            throw new HttpError("Result not found", 404);
        }

        await result.destroy();
        return { message: "Result deleted successfully" };
    } catch (error) {
        throw error;
    }
};

export const getUserTestStatisticsService = async (userId: string) => {
    try {
        const results = await Result.findAll({
            where: { userId },
            attributes: [
                'testId',
                [sequelize.fn('COUNT', sequelize.col('id')), 'attemptCount'],
                [sequelize.fn('AVG', sequelize.col('score')), 'averageScore'],
                [sequelize.fn('MAX', sequelize.col('score')), 'highestScore'],
                [sequelize.fn('MIN', sequelize.col('score')), 'lowestScore'],
            ],
            group: ['testId'],
            include: [
                {
                    model: Test,
                    as: 'test',
                    attributes: ['id', 'name']
                }
            ]
        });

        return results;
    } catch (error) {
        throw error;
    }
};

export const getTestRankingsService = async (testId: string) => {
    try {
        // Get best attempt per user (highest score, then fastest time as tiebreaker)
        const results = await Result.findAll({
            where: { testId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email'],
                }
            ],
            order: [
                ['score', 'DESC'],
                ['timeTaken', 'ASC'],   // faster time = better rank on tie
                ['completedAt', 'ASC'], // earlier submission wins if both same
            ],
        });

        // Deduplicate: keep only best attempt per user
        const seen = new Set<string>();
        const unique = results.filter((r: any) => {
            const uid = r.getDataValue('userId');
            if (seen.has(uid)) return false;
            seen.add(uid);
            return true;
        });

        // Attach rank
        const rankings = unique.map((result: any, index: number) => ({
            rank: index + 1,
            userId: result.getDataValue('userId'),
            user: (result as any).user,
            score: result.getDataValue('score'),
            totalPossiblePoints: result.getDataValue('totalPossiblePoints'),
            percentageScore: result.getDataValue('percentageScore'),
            correctCount: result.getDataValue('correctCount'),
            incorrectCount: result.getDataValue('incorrectCount'),
            timeTaken: result.getDataValue('timeTaken'),
            hasPassed: result.getDataValue('hasPassed'),
            completedAt: result.getDataValue('completedAt'),
        }));

        return rankings;
    } catch (error) {
        throw error;
    }
};