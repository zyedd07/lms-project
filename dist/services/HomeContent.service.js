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
exports.uploadSliderImagesService = exports.updateHomeContentService = exports.getHomeContentService = void 0;
const HomeContent_model_1 = __importDefault(require("../models/HomeContent.model"));
const Course_model_1 = __importDefault(require("../models/Course.model"));
const TestSeries_model_1 = __importDefault(require("../models/TestSeries.model"));
const QuestionBank_model_1 = __importDefault(require("../models/QuestionBank.model"));
const httpError_1 = __importDefault(require("../utils/httpError"));
const supabase_js_1 = require("@supabase/supabase-js");
const uuid_1 = require("uuid");
// --- Supabase client setup using environment variables ---
let supabase;
try {
    console.log("[SUPABASE INIT - HomeContent] Attempting to initialize Supabase client...");
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseKey) {
        supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: false,
            },
        });
        console.log("[SUPABASE INIT - HomeContent] Supabase client initialized SUCCESSFULLY.");
    }
    else {
        console.error("[SUPABASE INIT ERROR - HomeContent] Supabase client NOT initialized. Image upload features will fail.");
    }
}
catch (error) {
    console.error("[SUPABASE INIT ERROR - HomeContent] Unexpected error during Supabase client initialization:", error);
}
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
 * This service takes arrays of names for top-rated items, fetches their details,
 * and stores the structured data.
 * @param {UpdateHomeContentParams} params - The fields to update.
 * @returns {Promise<HomeContent>} The updated home content instance.
 */
const updateHomeContentService = (params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const content = yield (0, exports.getHomeContentService)();
        // Prepare a payload with the direct updates
        const updatePayload = {
            questionOfTheDay: params.questionOfTheDay,
            aboutUsText: params.aboutUsText,
            customSections: params.customSections,
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
/**
 * @description Uploads slider images and updates the database record with the new URLs.
 * @param {multer.File[]} files - An array of files from the multipart request.
 * @returns {Promise<HomeContent>} The updated home content instance.
 */
const uploadSliderImagesService = (files) => __awaiter(void 0, void 0, void 0, function* () {
    if (!supabase) {
        throw new httpError_1.default("Storage service is not initialized. Cannot upload images.", 500);
    }
    if (!files || files.length === 0) {
        throw new httpError_1.default("No image files were provided for upload.", 400);
    }
    const uploadPromises = files.map(file => {
        const fileName = `${(0, uuid_1.v4)()}-${file.originalname}`;
        return supabase.storage.from('slider-images').upload(fileName, file.buffer, {
            contentType: file.mimetype,
        });
    });
    try {
        const uploadResults = yield Promise.all(uploadPromises);
        const imageUrls = [];
        for (const result of uploadResults) {
            if (result.error) {
                throw new httpError_1.default(`Failed to upload image: ${result.error.message}`, 500);
            }
            const { data } = supabase.storage.from('slider-images').getPublicUrl(result.data.path);
            imageUrls.push(data.publicUrl);
        }
        const content = yield (0, exports.getHomeContentService)();
        const updatedContent = yield content.update({ sliderImages: imageUrls });
        return updatedContent;
    }
    catch (error) {
        console.error("Error during slider image upload:", error);
        if (error instanceof httpError_1.default)
            throw error;
        throw new httpError_1.default("An error occurred during file upload.", 500);
    }
});
exports.uploadSliderImagesService = uploadSliderImagesService;
