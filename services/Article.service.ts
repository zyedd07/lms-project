import Article from '../models/Article.model';
import HttpError from '../utils/httpError';
import { Op } from 'sequelize';
import { CreateArticleParams, UpdateArticleParams } from "../utils/types";
/**
 * @description Create a new article.
 * @param {CreateArticleParams} params - The data for the new article.
 * @returns {Promise<Article>} The created article instance.
 */
export const createArticleService = async (params: CreateArticleParams): Promise<Article> => {
    try {
        const newArticle = await Article.create(params);
        return newArticle;
    } catch (error) {
        console.error("Error creating article:", error);
        throw new HttpError("Failed to create article.", 500);
    }
};

/**
 * @description Get a list of all articles.
 * @returns {Promise<Article[]>} An array of articles.
 */
export const getAllArticlesService = async (): Promise<Article[]> => {
    try {
        const articles = await Article.findAll({
            order: [['createdAt', 'DESC']], // Show newest articles first
        });
        return articles;
    } catch (error) {
        console.error("Error fetching articles:", error);
        throw new HttpError("Failed to fetch articles.", 500);
    }
};

/**
 * @description Get a single article by its ID.
 * @param {string} articleId - The ID of the article.
 * @returns {Promise<Article>} The article instance.
 */
export const getArticleByIdService = async (articleId: string): Promise<Article> => {
    try {
        const article = await Article.findByPk(articleId);
        if (!article) {
            throw new HttpError("Article not found.", 404);
        }
        return article;
    } catch (error) {
        if (error instanceof HttpError) throw error;
        console.error("Error fetching article by ID:", error);
        throw new HttpError("Failed to fetch article.", 500);
    }
};

/**
 * @description Update an existing article.
 * @param {string} articleId - The ID of the article to update.
 * @param {UpdateArticleParams} params - The fields to update.
 * @returns {Promise<Article>} The updated article instance.
 */
export const updateArticleService = async (articleId: string, params: UpdateArticleParams): Promise<Article> => {
    try {
        const article = await getArticleByIdService(articleId); // Reuse getById to check existence
        const updatedArticle = await article.update(params);
        return updatedArticle;
    } catch (error) {
        if (error instanceof HttpError) throw error;
        console.error("Error updating article:", error);
        throw new HttpError("Failed to update article.", 500);
    }
};

/**
 * @description Delete an article.
 * @param {string} articleId - The ID of the article to delete.
 * @returns {Promise<{ message: string }>} A success message.
 */
export const deleteArticleService = async (articleId: string): Promise<{ message: string }> => {
    try {
        const article = await getArticleByIdService(articleId); // Reuse getById to check existence
        await article.destroy();
        return { message: "Article deleted successfully." };
    } catch (error) {
        if (error instanceof HttpError) throw error;
        console.error("Error deleting article:", error);
        throw new HttpError("Failed to delete article.", 500);
    }
};
