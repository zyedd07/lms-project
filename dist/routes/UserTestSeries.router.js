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
const UserTestSeriesController = __importStar(require("../controllers/UserTestSeries.controller"));
const auth_1 = __importStar(require("../middleware/auth"));
const router = express_1.default.Router();
// Enroll a user in a test series
router.post('/enroll', auth_1.default, auth_1.authorizeAdmin, UserTestSeriesController.enrollInTestSeries);
// Get all test series for a specific user
router.get('/user/:userId/testseries', auth_1.default, auth_1.authorizeAdmin, UserTestSeriesController.getUserTestSeries);
// Unenroll a user from a test series
router.delete('/unenroll', auth_1.default, auth_1.authorizeAdmin, UserTestSeriesController.unenrollFromTestSeries);
// Update the status of a test series enrollment
router.put('/status', auth_1.default, auth_1.authorizeAdmin, UserTestSeriesController.updateEnrollmentStatus);
exports.default = router;
