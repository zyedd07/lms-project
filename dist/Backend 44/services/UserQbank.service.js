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
exports.updateQbankEnrollmentStatus = exports.unenrollUserFromQbank = exports.getEnrolledQbanksForUser = exports.enrollUserInQbank = void 0;
const UserQbank_model_1 = __importDefault(require("../models/UserQbank.model"));
const QuestionBank_model_1 = __importDefault(require("../models/QuestionBank.model"));
const httpError_1 = __importDefault(require("../utils/httpError"));
const enrollUserInQbank = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId, qbankId }) {
    const existingEnrollment = yield UserQbank_model_1.default.findOne({
        where: { userId, qbankId }
    });
    if (existingEnrollment) {
        throw new httpError_1.default("User is already enrolled in this Q-Bank.", 409);
    }
    const newEnrollment = yield UserQbank_model_1.default.create({ userId, qbankId });
    return newEnrollment;
});
exports.enrollUserInQbank = enrollUserInQbank;
const getEnrolledQbanksForUser = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId }) {
    const enrollments = yield UserQbank_model_1.default.findAll({
        where: { userId },
        include: [{
                model: QuestionBank_model_1.default,
                attributes: ['id', 'name', 'description', 'price', 'filePath']
            }]
    });
    return enrollments;
});
exports.getEnrolledQbanksForUser = getEnrolledQbanksForUser;
const unenrollUserFromQbank = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId, qbankId }) {
    const result = yield UserQbank_model_1.default.destroy({
        where: { userId, qbankId }
    });
    if (result === 0) {
        throw new httpError_1.default("Enrollment record not found.", 404);
    }
    return true;
});
exports.unenrollUserFromQbank = unenrollUserFromQbank;
const updateQbankEnrollmentStatus = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId, qbankId, status }) {
    const enrollment = yield UserQbank_model_1.default.findOne({
        where: { userId, qbankId }
    });
    if (!enrollment) {
        throw new httpError_1.default("Enrollment record not found.", 404);
    }
    enrollment.status = status;
    yield enrollment.save();
    return enrollment;
});
exports.updateQbankEnrollmentStatus = updateQbankEnrollmentStatus;
