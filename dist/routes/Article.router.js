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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const articleController = __importStar(require("../controllers/Article.controller"));
const auth_1 = __importStar(require("../middleware/auth")); // Assuming auth middleware exists
const router = express_1.default.Router();
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
router.post('/create', auth_1.default, auth_1.authorizeAdmin, articleController.createArticle);
/**
 * @route   PUT /api/articles/:articleId
 * @desc    Update an existing article
 * @access  Private (Admin)
 */
router.put('/:articleId', auth_1.default, auth_1.authorizeAdmin, articleController.updateArticle);
/**
 * @route   DELETE /api/articles/:articleId
 * @desc    Delete an article
 * @access  Private (Admin)
 */
router.delete('/:articleId', auth_1.default, auth_1.authorizeAdmin, articleController.deleteArticle);
exports.default = router;
