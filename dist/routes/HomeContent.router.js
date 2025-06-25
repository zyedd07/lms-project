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
const homeContentController = __importStar(require("../controllers/HomeContent.controller"));
const auth_1 = __importStar(require("../middleware/auth")); // Assuming auth middleware exists
const HomeContent_controller_1 = require("../controllers/HomeContent.controller"); // Import the multer upload instance
const router = express_1.default.Router();
// --- Public Route ---
/**
 * @route   GET /api/home-content
 * @desc    Get the dynamic content for the home screen
 * @access  Public
 */
router.get('/', homeContentController.getHomeContent);
// --- Admin-only Routes ---
/**
 * @route   PUT /api/home-content/update
 * @desc    Update text-based fields (QOTD, About Us, Custom Sections)
 * @access  Private (Admin)
 */
router.put('/update', auth_1.default, auth_1.authorizeAdmin, homeContentController.updateHomeContent);
/**
 * @route   POST /api/home-content/slider-images
 * @desc    Upload and replace all slider images
 * @access  Private (Admin)
 */
router.post('/slider-images', auth_1.default, auth_1.authorizeAdmin, HomeContent_controller_1.upload.array('sliderImages', 5), // 'sliderImages' must match the key in FormData, max 5 files
homeContentController.uploadSliderImages);
exports.default = router;
