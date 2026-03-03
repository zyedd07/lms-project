import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import HttpError from "../utils/httpError";
import {
    createTestService,
    getTestByIdService,
    updateTestService,
    deleteTestService,
    getTestsByTestSeriesService,
    checkTestScheduleService,  // NEW
} from "../services/Test.service";
import { checkUserTestEligibilityService, markTestStartedService } from "../services/Usertestattempt.service";
import { Role } from "../utils/constants";

export const createTestController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.id) {
            throw new HttpError("Authentication required: User ID is missing.", 401);
        }

        const role = req.user.role;
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized", 403);
        }

        const {
            testSeriesId,
            name,
            description,
            durationMinutes,
            numberOfQuestions,
            passMarkPercentage,
            scheduledStartTime,  // NEW
            scheduledEndTime,    // NEW
            timerEnabled,        // NEW
        } = req.body;

        if (!testSeriesId || !name || durationMinutes === undefined || numberOfQuestions === undefined || passMarkPercentage === undefined) {
            throw new HttpError("TestSeries ID, name, duration, number of questions, and pass mark are required.", 400);
        }

        // NEW: Validate schedule window if both times are provided
        if (scheduledStartTime && scheduledEndTime) {
            const start = new Date(scheduledStartTime);
            const end = new Date(scheduledEndTime);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                throw new HttpError("Invalid date format for scheduledStartTime or scheduledEndTime.", 400);
            }
            if (end <= start) {
                throw new HttpError("scheduledEndTime must be after scheduledStartTime.", 400);
            }
        }

        const newTest = await createTestService({
            testSeriesId,
            name,
            description,
            durationMinutes,
            numberOfQuestions,
            passMarkPercentage,
            createdBy: req.user.id,
            scheduledStartTime: scheduledStartTime ?? null,  // NEW
            scheduledEndTime: scheduledEndTime ?? null,      // NEW
            timerEnabled: timerEnabled ?? true,              // NEW: timer ON by default
        });

        res.status(201).json({ success: true, data: newTest });
    } catch (error) {
        next(error);
    }
};

/**
 * Get test details and check if user can attempt it.
 * - Admins/Teachers: always get full test data + schedule metadata.
 * - Students outside schedule window: get limited info + reason message, no eligibility check.
 * - Students inside schedule window: get full data + eligibility + timerEnabled flag.
 */
export const getTestController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const test = await getTestByIdService(id);

        // Admins and Teachers bypass schedule restrictions
        if (req.user && (req.user.role === Role.ADMIN || req.user.role === Role.TEACHER)) {
            res.status(200).json({
                success: true,
                data: {
                    test,
                    scheduleStatus: checkTestScheduleService(test), // useful for admin preview
                    attemptInfo: null,
                }
            });
            return;
        }

        // NEW: Enforce schedule window for students and unauthenticated users
        const scheduleStatus = checkTestScheduleService(test);

        if (!scheduleStatus.accessible) {
            res.status(200).json({
                success: true,
                data: {
                    // Only expose non-sensitive fields when window is closed
                    test: {
                        id: (test as any).id,
                        name: (test as any).name,
                        description: (test as any).description,
                        scheduledStartTime: (test as any).scheduledStartTime,
                        scheduledEndTime: (test as any).scheduledEndTime,
                    },
                    scheduleStatus, // { accessible: false, reason: "Test opens at ...", timerEnabled }
                    attemptInfo: null,
                }
            });
            return;
        }

        // Schedule window is open — check eligibility for authenticated students
        if (req.user && req.user.id && req.user.role === Role.STUDENT) {
            try {
                const eligibility = await checkUserTestEligibilityService(req.user.id, id);
                res.status(200).json({
                    success: true,
                    data: {
                        test,
                        scheduleStatus,  // carries timerEnabled for the frontend
                        attemptInfo: eligibility,
                    }
                });
                return;
            } catch (err) {
                console.error("Error checking eligibility:", err);
            }
        }

        res.status(200).json({
            success: true,
            data: {
                test,
                scheduleStatus,
                attemptInfo: null,
            }
        });
    } catch (error) {
        next(error);
    }
};

export const updateTestController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const {
            name,
            description,
            durationMinutes,
            numberOfQuestions,
            passMarkPercentage,
            scheduledStartTime,  // NEW
            scheduledEndTime,    // NEW
            timerEnabled,        // NEW
        } = req.body;

        if (!req.user || !req.user.role) {
            throw new HttpError("Authentication required: User role is missing.", 401);
        }

        const role = req.user.role;
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized", 403);
        }

        // NEW: Validate schedule window if both times are provided
        if (scheduledStartTime && scheduledEndTime) {
            const start = new Date(scheduledStartTime);
            const end = new Date(scheduledEndTime);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                throw new HttpError("Invalid date format for scheduledStartTime or scheduledEndTime.", 400);
            }
            if (end <= start) {
                throw new HttpError("scheduledEndTime must be after scheduledStartTime.", 400);
            }
        }

        const result = await updateTestService(id, {
            name,
            description,
            durationMinutes,
            numberOfQuestions,
            passMarkPercentage,
            scheduledStartTime: scheduledStartTime ?? undefined,  // NEW: undefined = don't touch the field
            scheduledEndTime: scheduledEndTime ?? undefined,      // NEW
            timerEnabled: timerEnabled ?? undefined,              // NEW
        });

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const deleteTestController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        if (!req.user || !req.user.role) {
            throw new HttpError("Authentication required: User role is missing.", 401);
        }

        const role = req.user.role;
        if (role !== Role.ADMIN && role !== Role.TEACHER) {
            throw new HttpError("Unauthorized", 403);
        }

        const result = await deleteTestService(id);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

export const getTestsByTestSeriesController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { testSeriesId } = req.query;
        if (!testSeriesId) {
            throw new HttpError("TestSeries ID is required as a query parameter (e.g., ?testSeriesId=...).", 400);
        }

        const tests = await getTestsByTestSeriesService(testSeriesId as string);

        // NEW: Attach live schedule status to each test so the frontend
        // can show "Opens at...", "Closed", or "Live now" without extra calls
        const testsWithSchedule = (tests as any[]).map(test => ({
            ...test.toJSON(),
            scheduleStatus: checkTestScheduleService(test),
        }));

        res.status(200).json({ success: true, data: testsWithSchedule });
    } catch (error) {
        next(error);
    }
};