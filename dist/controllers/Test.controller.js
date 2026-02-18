"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestsByTestSeriesController = exports.deleteTestController = exports.updateTestController = exports.getTestController = exports.createTestController = void 0;
const httpError_1 = __importDefault(require("../utils/httpError"));
const Test_service_1 = require("../services/Test.service");
const Usertestattempt_service_1 = require("../services/Usertestattempt.service");
const constants_1 = require("../utils/constants");
const createTestController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user.id) {
            throw new httpError_1.default("Authentication required: User ID is missing.", 401);
        }
        const role = req.user.role;
        if (role !== constants_1.Role.ADMIN && role !== constants_1.Role.TEACHER) {
            throw new httpError_1.default("Unauthorized", 403);
        }
        const { testSeriesId, name, description, durationMinutes, numberOfQuestions, passMarkPercentage, scheduledStartTime, // NEW
        scheduledEndTime, // NEW
        timerEnabled, // NEW
         } = req.body;
        if (!testSeriesId || !name || durationMinutes === undefined || numberOfQuestions === undefined || passMarkPercentage === undefined) {
            throw new httpError_1.default("TestSeries ID, name, duration, number of questions, and pass mark are required.", 400);
        }
        // NEW: Validate schedule window if both times are provided
        if (scheduledStartTime && scheduledEndTime) {
            const start = new Date(scheduledStartTime);
            const end = new Date(scheduledEndTime);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                throw new httpError_1.default("Invalid date format for scheduledStartTime or scheduledEndTime.", 400);
            }
            if (end <= start) {
                throw new httpError_1.default("scheduledEndTime must be after scheduledStartTime.", 400);
            }
        }
        const newTest = yield (0, Test_service_1.createTestService)({
            testSeriesId,
            name,
            description,
            durationMinutes,
            numberOfQuestions,
            passMarkPercentage,
            createdBy: req.user.id,
            scheduledStartTime: scheduledStartTime !== null && scheduledStartTime !== void 0 ? scheduledStartTime : null, // NEW
            scheduledEndTime: scheduledEndTime !== null && scheduledEndTime !== void 0 ? scheduledEndTime : null, // NEW
            timerEnabled: timerEnabled !== null && timerEnabled !== void 0 ? timerEnabled : true, // NEW: timer ON by default
        });
        res.status(201).json({ success: true, data: newTest });
    }
    catch (error) {
        next(error);
    }
});
exports.createTestController = createTestController;
/**
 * Get test details and check if user can attempt it.
 * - Admins/Teachers: always get full test data + schedule metadata.
 * - Students outside schedule window: get limited info + reason message, no eligibility check.
 * - Students inside schedule window: get full data + eligibility + timerEnabled flag.
 */
const getTestController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const test = yield (0, Test_service_1.getTestByIdService)(id);
        // Admins and Teachers bypass schedule restrictions
        if (req.user && (req.user.role === constants_1.Role.ADMIN || req.user.role === constants_1.Role.TEACHER)) {
            res.status(200).json({
                success: true,
                data: {
                    test,
                    scheduleStatus: (0, Test_service_1.checkTestScheduleService)(test), // useful for admin preview
                    attemptInfo: null,
                }
            });
            return;
        }
        // NEW: Enforce schedule window for students and unauthenticated users
        const scheduleStatus = (0, Test_service_1.checkTestScheduleService)(test);
        if (!scheduleStatus.accessible) {
            res.status(200).json({
                success: true,
                data: {
                    // Only expose non-sensitive fields when window is closed
                    test: {
                        id: test.id,
                        name: test.name,
                        description: test.description,
                        scheduledStartTime: test.scheduledStartTime,
                        scheduledEndTime: test.scheduledEndTime,
                    },
                    scheduleStatus, // { accessible: false, reason: "Test opens at ...", timerEnabled }
                    attemptInfo: null,
                }
            });
            return;
        }
        // Schedule window is open — check eligibility for authenticated students
        if (req.user && req.user.id && req.user.role === constants_1.Role.STUDENT) {
            try {
                const eligibility = yield (0, Usertestattempt_service_1.checkUserTestEligibilityService)(req.user.id, id);
                res.status(200).json({
                    success: true,
                    data: {
                        test,
                        scheduleStatus, // carries timerEnabled for the frontend
                        attemptInfo: eligibility,
                    }
                });
                return;
            }
            catch (err) {
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
    }
    catch (error) {
        next(error);
    }
});
exports.getTestController = getTestController;
const updateTestController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, description, durationMinutes, numberOfQuestions, passMarkPercentage, scheduledStartTime, // NEW
        scheduledEndTime, // NEW
        timerEnabled, // NEW
         } = req.body;
        if (!req.user || !req.user.role) {
            throw new httpError_1.default("Authentication required: User role is missing.", 401);
        }
        const role = req.user.role;
        if (role !== constants_1.Role.ADMIN && role !== constants_1.Role.TEACHER) {
            throw new httpError_1.default("Unauthorized", 403);
        }
        // NEW: Validate schedule window if both times are provided
        if (scheduledStartTime && scheduledEndTime) {
            const start = new Date(scheduledStartTime);
            const end = new Date(scheduledEndTime);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                throw new httpError_1.default("Invalid date format for scheduledStartTime or scheduledEndTime.", 400);
            }
            if (end <= start) {
                throw new httpError_1.default("scheduledEndTime must be after scheduledStartTime.", 400);
            }
        }
        const result = yield (0, Test_service_1.updateTestService)(id, {
            name,
            description,
            durationMinutes,
            numberOfQuestions,
            passMarkPercentage,
            scheduledStartTime: scheduledStartTime !== null && scheduledStartTime !== void 0 ? scheduledStartTime : undefined, // NEW: undefined = don't touch the field
            scheduledEndTime: scheduledEndTime !== null && scheduledEndTime !== void 0 ? scheduledEndTime : undefined, // NEW
            timerEnabled: timerEnabled !== null && timerEnabled !== void 0 ? timerEnabled : undefined, // NEW
        });
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
exports.updateTestController = updateTestController;
const deleteTestController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!req.user || !req.user.role) {
            throw new httpError_1.default("Authentication required: User role is missing.", 401);
        }
        const role = req.user.role;
        if (role !== constants_1.Role.ADMIN && role !== constants_1.Role.TEACHER) {
            throw new httpError_1.default("Unauthorized", 403);
        }
        const result = yield (0, Test_service_1.deleteTestService)(id);
        res.status(200).json(Object.assign({ success: true }, result));
    }
    catch (error) {
        next(error);
    }
});
exports.deleteTestController = deleteTestController;
const getTestsByTestSeriesController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { testSeriesId } = req.query;
        if (!testSeriesId) {
            throw new httpError_1.default("TestSeries ID is required as a query parameter (e.g., ?testSeriesId=...).", 400);
        }
        const tests = yield (0, Test_service_1.getTestsByTestSeriesService)(testSeriesId);
        // NEW: Attach live schedule status to each test so the frontend
        // can show "Opens at...", "Closed", or "Live now" without extra calls
        const testsWithSchedule = tests.map(test => (Object.assign(Object.assign({}, test.toJSON()), { scheduleStatus: (0, Test_service_1.checkTestScheduleService)(test) })));
        res.status(200).json({ success: true, data: testsWithSchedule });
    }
    catch (error) {
        next(error);
    }
});
exports.getTestsByTestSeriesController = getTestsByTestSeriesController;
