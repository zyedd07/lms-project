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
const UserCourseController = __importStar(require("../controllers/UserCourse.controller"));
const auth_1 = __importStar(require("../middleware/auth"));
const router = express_1.default.Router();
// Route to enroll a user in a course
router.post('/enroll', auth_1.default, UserCourseController.enrollInCourse);
// Route to get all courses for a specific user
router.get('/user/:userId/courses', auth_1.default, UserCourseController.getUserCourses);
// Route to remove a user's enrollment from a course
router.delete('/unenroll', auth_1.default, UserCourseController.unenrollFromCourse);
// --- NEW ROUTE ---
// Route to update the status of an enrollment (e.g., 'active', 'completed', 'dropped')
// The frontend will send { userId, courseId, status } in the request body.
router.put('/status', auth_1.default, auth_1.authorizeAdmin, UserCourseController.updateEnrollmentStatus);
exports.default = router;
