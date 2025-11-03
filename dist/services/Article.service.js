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
exports.deleteArticleService = exports.updateArticleService = exports.getArticleByIdService = exports.getAllArticlesService = exports.createArticleService = void 0;
const Article_model_1 = __importDefault(require("../models/Article.model"));
const httpError_1 = __importDefault(require("../utils/httpError"));
/**
 * @description Create a new article.
 * @param {CreateArticleParams} params - The data for the new article.
 * @returns {Promise<Article>} The created article instance.
 */
const createArticleService = (params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newArticle = yield Article_model_1.default.create(params);
        return newArticle;
    }
    catch (error) {
        console.error("Error creating article:", error);
        throw new httpError_1.default("Failed to create article.", 500);
    }
});
exports.createArticleService = createArticleService;
/**
 * @description Get a list of all articles.
 * @returns {Promise<Article[]>} An array of articles.
 */
const getAllArticlesService = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const articles = yield Article_model_1.default.findAll({
            order: [['createdAt', 'DESC']], // Show newest articles first
        });
        return articles;
    }
    catch (error) {
        console.error("Error fetching articles:", error);
        throw new httpError_1.default("Failed to fetch articles.", 500);
    }
});
exports.getAllArticlesService = getAllArticlesService;
/**
 * @description Get a single article by its ID.
 * @param {string} articleId - The ID of the article.
 * @returns {Promise<Article>} The article instance.
 */
const getArticleByIdService = (articleId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const article = yield Article_model_1.default.findByPk(articleId);
        if (!article) {
            throw new httpError_1.default("Article not found.", 404);
        }
        return article;
    }
    catch (error) {
        if (error instanceof httpError_1.default)
            throw error;
        console.error("Error fetching article by ID:", error);
        throw new httpError_1.default("Failed to fetch article.", 500);
    }
});
exports.getArticleByIdService = getArticleByIdService;
/**
 * @description Update an existing article.
 * @param {string} articleId - The ID of the article to update.
 * @param {UpdateArticleParams} params - The fields to update.
 * @returns {Promise<Article>} The updated article instance.
 */
const updateArticleService = (articleId, params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const article = yield (0, exports.getArticleByIdService)(articleId); // Reuse getById to check existence
        const updatedArticle = yield article.update(params);
        return updatedArticle;
    }
    catch (error) {
        if (error instanceof httpError_1.default)
            throw error;
        console.error("Error updating article:", error);
        throw new httpError_1.default("Failed to update article.", 500);
    }
});
exports.updateArticleService = updateArticleService;
/**
 * @description Delete an article.
 * @param {string} articleId - The ID of the article to delete.
 * @returns {Promise<{ message: string }>} A success message.
 */
const deleteArticleService = (articleId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const article = yield (0, exports.getArticleByIdService)(articleId); // Reuse getById to check existence
        yield article.destroy();
        return { message: "Article deleted successfully." };
    }
    catch (error) {
        if (error instanceof httpError_1.default)
            throw error;
        console.error("Error deleting article:", error);
        throw new httpError_1.default("Failed to delete article.", 500);
    }
});
exports.deleteArticleService = deleteArticleService;
