import { Request, Response, NextFunction } from 'express';
import * as articleService from '../services/Article.service';
import { CreateArticleParams, UpdateArticleParams } from '../utils/types';
import HttpError from '../utils/httpError';

/**
 * @description Controller to create a new article.
 */
export const createArticle = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const params: CreateArticleParams = req.body;
        if (!params.title || !params.content || !params.doctorName || !params.imageUrl) {
            throw new HttpError("Title, content, doctorName, and imageUrl are required.", 400);
        }
        const newArticle = await articleService.createArticleService(params);
        res.status(201).json({
            success: true,
            message: "Article created successfully.",
            data: newArticle
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @description Controller to get all articles.
 */
export const getAllArticles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const articles = await articleService.getAllArticlesService();
        res.status(200).json({
            success: true,
            message: "Articles fetched successfully.",
            data: articles
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @description Controller to get a single article by its ID.
 */
export const getArticleById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { articleId } = req.params;
        if (!articleId) {
            throw new HttpError("Article ID is required.", 400);
        }
        const article = await articleService.getArticleByIdService(articleId);
        res.status(200).json({
            success: true,
            message: "Article fetched successfully.",
            data: article
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @description Controller to update an existing article.
 */
export const updateArticle = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { articleId } = req.params;
        const params: UpdateArticleParams = req.body;

        if (!articleId) {
            throw new HttpError("Article ID is required.", 400);
        }
        if (Object.keys(params).length === 0) {
            throw new HttpError("No update data provided.", 400);
        }

        const updatedArticle = await articleService.updateArticleService(articleId, params);
        res.status(200).json({
            success: true,
            message: "Article updated successfully.",
            data: updatedArticle
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @description Controller to delete an article.
 */
export const deleteArticle = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { articleId } = req.params;
        if (!articleId) {
            throw new HttpError("Article ID is required.", 400);
        }
        const result = await articleService.deleteArticleService(articleId);
        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        next(error);
    }
};
