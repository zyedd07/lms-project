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
// src/routes/brandCategory.router.ts
const express_1 = __importDefault(require("express"));
const BrandCategoryController = __importStar(require("../controllers/brandCategoryController")); // Ensure correct import path for the controller
const auth_1 = __importDefault(require("../middleware/auth")); // Assuming isAuth middleware is used for admin authentication
const router = express_1.default.Router();
router.post('/create', auth_1.default, BrandCategoryController.createBrandCategoryController);
router.get('/', BrandCategoryController.getAllBrandCategoriesController); // Often public, or adjust isAuth as needed
router.get('/:id', BrandCategoryController.getBrandCategoryByIdController); // Often public, or adjust isAuth as needed
router.put('/:id', auth_1.default, BrandCategoryController.updateBrandCategoryController);
router.delete('/:id', auth_1.default, BrandCategoryController.deleteBrandCategoryController);
exports.default = router;
