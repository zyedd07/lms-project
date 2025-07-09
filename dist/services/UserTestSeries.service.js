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
exports.updateTestSeriesEnrollmentStatus = exports.unenrollUserFromTestSeries = exports.getEnrolledTestSeriesForUser = exports.enrollUserInTestSeries = void 0;
const UserTestSeries_model_1 = __importDefault(require("../models/UserTestSeries.model"));
const TestSeries_model_1 = __importDefault(require("../models/TestSeries.model"));
const httpError_1 = __importDefault(require("../utils/httpError"));
const enrollUserInTestSeries = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId, testSeriesId }) {
    const existingEnrollment = yield UserTestSeries_model_1.default.findOne({
        where: { userId, testSeriesId }
    });
    if (existingEnrollment) {
        throw new httpError_1.default("User is already enrolled in this test series.", 409);
    }
    const newEnrollment = yield UserTestSeries_model_1.default.create({ userId, testSeriesId });
    return newEnrollment;
});
exports.enrollUserInTestSeries = enrollUserInTestSeries;
const getEnrolledTestSeriesForUser = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId }) {
    const enrollments = yield UserTestSeries_model_1.default.findAll({
        where: { userId },
        include: [{
                model: TestSeries_model_1.default,
                attributes: ['id', 'name', 'description', 'price']
            }]
    });
    return enrollments;
});
exports.getEnrolledTestSeriesForUser = getEnrolledTestSeriesForUser;
const unenrollUserFromTestSeries = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId, testSeriesId }) {
    const result = yield UserTestSeries_model_1.default.destroy({
        where: { userId, testSeriesId }
    });
    if (result === 0) {
        throw new httpError_1.default("Enrollment record not found.", 404);
    }
    return true;
});
exports.unenrollUserFromTestSeries = unenrollUserFromTestSeries;
const updateTestSeriesEnrollmentStatus = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId, testSeriesId, status }) {
    const enrollment = yield UserTestSeries_model_1.default.findOne({
        where: { userId, testSeriesId }
    });
    if (!enrollment) {
        throw new httpError_1.default("Enrollment record not found.", 404);
    }
    enrollment.status = status;
    yield enrollment.save();
    return enrollment;
});
exports.updateTestSeriesEnrollmentStatus = updateTestSeriesEnrollmentStatus;
