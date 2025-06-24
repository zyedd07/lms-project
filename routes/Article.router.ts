import express from 'express';
import * as articleController from '../controllers/Article.controller';
import isAuth, { authorizeAdmin } from '../middleware/auth'; // Assuming auth middleware exists

const router = express.Router();

// --- Public Routes ---
// Anyone can view the list of articles and individual articles.

/**
 * @route   GET /api/articles
 * @desc    Get a list of all articles
 * @access  Public
 */
router.get('/', articleController.getAllArticles);

/**
 * @route   GET /api/articles/:articleId
 * @desc    Get a single article by its ID
 * @access  Public
 */
router.get('/:articleId', articleController.getArticleById);


// --- Admin-only Routes ---
// Only authenticated admins can create, update, or delete articles.

/**
 * @route   POST /api/articles/create
 * @desc    Create a new article
 * @access  Private (Admin)
 */
router.post(
    '/create',
    isAuth,
    authorizeAdmin,
    articleController.createArticle
);

/**
 * @route   PUT /api/articles/:articleId
 * @desc    Update an existing article
 * @access  Private (Admin)
 */
router.put(
    '/:articleId',
    isAuth,
    authorizeAdmin,
    articleController.updateArticle
);

/**
 * @route   DELETE /api/articles/:articleId
 * @desc    Delete an article
 * @access  Private (Admin)
 */
router.delete(
    '/:articleId',
    isAuth,
    authorizeAdmin,
    articleController.deleteArticle
);

export default router;
