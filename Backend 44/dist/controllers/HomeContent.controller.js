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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateHomeContent = exports.getHomeContent = void 0;
const homeContentService = __importStar(require("../services/HomeContent.service"));
const httpError_1 = __importDefault(require("../utils/httpError"));
/**
 * @description Controller to get the single home content record.
 */
const getHomeContent = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const content = yield homeContentService.getHomeContentService();
        res.status(200).json({
            success: true,
            message: "Home content fetched successfully.",
            data: content
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getHomeContent = getHomeContent;
/**
 * @description Controller to update all fields of the home content, including slider image URLs.
 */
const updateHomeContent = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const params = req.body;
        // Basic validation to ensure some data is provided
        if (Object.keys(params).length === 0) {
            throw new httpError_1.default("No update data provided.", 400);
        }
        // Optional: Add specific validation for the sliderImages array
        if (params.sliderImages && !Array.isArray(params.sliderImages)) {
            throw new httpError_1.default("sliderImages must be an array of URLs.", 400);
        }
        const updatedContent = yield homeContentService.updateHomeContentService(params);
        res.status(200).json({
            success: true,
            message: "Home content updated successfully.",
            data: updatedContent
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateHomeContent = updateHomeContent;
// The uploadSliderImages controller and multer configuration have been removed.
