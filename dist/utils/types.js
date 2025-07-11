"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebinarStatus = exports.WebinarEnrollmentStatus = void 0;
var WebinarEnrollmentStatus;
(function (WebinarEnrollmentStatus) {
    WebinarEnrollmentStatus["ACTIVE"] = "active";
    WebinarEnrollmentStatus["COMPLETED"] = "completed";
    WebinarEnrollmentStatus["DROPPED"] = "dropped";
    WebinarEnrollmentStatus["REGISTERED"] = "registered";
    WebinarEnrollmentStatus["ATTENDED"] = "attended";
    WebinarEnrollmentStatus["CANCELLED"] = "cancelled"; // Added for cancelled enrollments
})(WebinarEnrollmentStatus || (exports.WebinarEnrollmentStatus = WebinarEnrollmentStatus = {}));
// --- Webinar Types ---
var WebinarStatus;
(function (WebinarStatus) {
    WebinarStatus["UPCOMING"] = "upcoming";
    WebinarStatus["LIVE"] = "live";
    WebinarStatus["RECORDED"] = "recorded";
})(WebinarStatus || (exports.WebinarStatus = WebinarStatus = {}));
