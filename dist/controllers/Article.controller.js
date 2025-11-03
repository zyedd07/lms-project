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
exports.deleteArticle = exports.updateArticle = exports.getArticleById = exports.getAllArticles = exports.createArticle = void 0;
const articleService = __importStar(require("../services/Article.service"));
const httpError_1 = __importDefault(require("../utils/httpError"));
/**
 * @description Controller to create a new article.
 */
const createArticle = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const params = req.body;
        if (!params.title || !params.content || !params.doctorName || !params.imageUrl) {
            throw new httpError_1.default("Title, content, doctorName, and imageUrl are required.", 400);
        }
        const newArticle = yield articleService.createArticleService(params);
        res.status(201).json({
            success: true,
            message: "Article created successfully.",
            data: newArticle
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createArticle = createArticle;
/**
 * @description Controller to get all articles.
 */
const getAllArticles = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const articles = yield articleService.getAllArticlesService();
        res.status(200).json({
            success: true,
            message: "Articles fetched successfully.",
            data: articles
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllArticles = getAllArticles;
/**
 * @description Controller to get a single article by its ID.
 */
const getArticleById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { articleId } = req.params;
        if (!articleId) {
            throw new httpError_1.default("Article ID is required.", 400);
        }
        const article = yield articleService.getArticleByIdService(articleId);
        res.status(200).json({
            success: true,
            message: "Article fetched successfully.",
            data: article
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getArticleById = getArticleById;
/**
 * @description Controller to update an existing article.
 */
const updateArticle = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { articleId } = req.params;
        const params = req.body;
        if (!articleId) {
            throw new httpError_1.default("Article ID is required.", 400);
        }
        if (Object.keys(params).length === 0) {
            throw new httpError_1.default("No update data provided.", 400);
        }
        const updatedArticle = yield articleService.updateArticleService(articleId, params);
        res.status(200).json({
            success: true,
            message: "Article updated successfully.",
            data: updatedArticle
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateArticle = updateArticle;
/**
 * @description Controller to delete an article.
 */
const deleteArticle = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { articleId } = req.params;
        if (!articleId) {
            throw new httpError_1.default("Article ID is required.", 400);
        }
        const result = yield articleService.deleteArticleService(articleId);
        res.status(200).json({
            success: true,
            message: result.message
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteArticle = deleteArticle;
