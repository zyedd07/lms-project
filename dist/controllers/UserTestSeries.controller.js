"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEnrollmentStatus = exports.unenrollFromTestSeries = exports.getUserTestSeries = exports.enrollInTestSeries = void 0;
const UserTestSeriesService = __importStar(require("../services/UserTestSeries.service"));
const enrollInTestSeries = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, testSeriesId } = req.body;
        const enrollment = yield UserTestSeriesService.enrollUserInTestSeries({ userId, testSeriesId });
        res.status(201).json({ success: true, message: 'User enrolled in test series successfully.', data: enrollment });
    }
    catch (error) {
        next(error);
    }
});
exports.enrollInTestSeries = enrollInTestSeries;
const getUserTestSeries = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const testSeries = yield UserTestSeriesService.getEnrolledTestSeriesForUser({ userId });
        res.status(200).json({ success: true, data: testSeries });
    }
    catch (error) {
        next(error);
    }
});
exports.getUserTestSeries = getUserTestSeries;
const unenrollFromTestSeries = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, testSeriesId } = req.body;
        yield UserTestSeriesService.unenrollUserFromTestSeries({ userId, testSeriesId });
        res.status(200).json({ success: true, message: 'User unenrolled from test series successfully.' });
    }
    catch (error) {
        next(error);
    }
});
exports.unenrollFromTestSeries = unenrollFromTestSeries;
const updateEnrollmentStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, testSeriesId, status } = req.body;
        const updatedEnrollment = yield UserTestSeriesService.updateTestSeriesEnrollmentStatus({ userId, testSeriesId, status });
        res.status(200).json({ success: true, message: 'Enrollment status updated successfully.', data: updatedEnrollment });
    }
    catch (error) {
        next(error);
    }
});
exports.updateEnrollmentStatus = updateEnrollmentStatus;
