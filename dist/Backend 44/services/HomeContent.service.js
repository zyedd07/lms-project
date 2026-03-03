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
exports.updateHomeContentService = exports.getHomeContentService = void 0;
const HomeContent_model_1 = __importDefault(require("../models/HomeContent.model"));
const Course_model_1 = __importDefault(require("../models/Course.model"));
const TestSeries_model_1 = __importDefault(require("../models/TestSeries.model"));
const QuestionBank_model_1 = __importDefault(require("../models/QuestionBank.model"));
const httpError_1 = __importDefault(require("../utils/httpError"));
// Supabase client and multer are no longer needed for this service
// You can remove the Supabase client setup and multer imports from this file.
/**
 * @description Get the current home page content.
 * If no content exists, it creates a default entry.
 * @returns {Promise<HomeContent>} The home content instance.
 */
const getHomeContentService = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let content = yield HomeContent_model_1.default.findOne();
        if (!content) {
            console.log("No home content found, creating a default entry.");
            content = yield HomeContent_model_1.default.create({});
        }
        return content;
    }
    catch (error) {
        console.error("Error fetching home content:", error);
        throw new httpError_1.default("Failed to retrieve home content.", 500);
    }
});
exports.getHomeContentService = getHomeContentService;
/**
 * @description Update the home page content.
 * This service now takes an array of image URLs in addition to the other content.
 * @param {UpdateHomeContentParams} params - The fields to update.
 * @returns {Promise<HomeContent>} The updated home content instance.
 */
const updateHomeContentService = (params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const content = yield (0, exports.getHomeContentService)();
        // Prepare a payload with all direct updates, including sliderImages
        const updatePayload = {
            questionOfTheDay: params.questionOfTheDay,
            aboutUsText: params.aboutUsText,
            customSections: params.customSections,
            // Include the sliderImages array directly from the request payload
            sliderImages: params.sliderImages,
        };
        // Dynamically fetch and structure Top Rated Courses
        if (params.topRatedCourseNames) {
            const coursePromises = params.topRatedCourseNames.map(name => Course_model_1.default.findOne({ where: { name }, attributes: ['id', 'name', 'description', 'price', 'demoVideoUrl', 'categoryId', 'syllabus', 'contents'] }));
            const courses = yield Promise.all(coursePromises);
            updatePayload.topRatedCourses = courses.filter(c => c !== null); // Filter out any names that weren't found
        }
        // Dynamically fetch and structure Top Rated Tests
        if (params.topRatedTestNames) {
            const testPromises = params.topRatedTestNames.map(name => TestSeries_model_1.default.findOne({ where: { name }, attributes: ['id', 'name', 'description', 'price'] }));
            const tests = yield Promise.all(testPromises);
            updatePayload.topRatedTests = tests.filter(t => t !== null);
        }
        // Dynamically fetch and structure Top Rated QBanks
        if (params.topRatedQbankNames) {
            const qbankPromises = params.topRatedQbankNames.map(name => QuestionBank_model_1.default.findOne({ where: { name }, attributes: ['id', 'name', 'description', 'filePath', 'fileName', 'price'] }));
            const qbanks = yield Promise.all(qbankPromises);
            updatePayload.topRatedQbanks = qbanks.filter(q => q !== null);
        }
        // Update the record with the new data
        const updatedContent = yield content.update(updatePayload);
        return updatedContent;
    }
    catch (error) {
        console.error("Error updating home content:", error);
        throw new httpError_1.default("Failed to update home content.", 500);
    }
});
exports.updateHomeContentService = updateHomeContentService;
