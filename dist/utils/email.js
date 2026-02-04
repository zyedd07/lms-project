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
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Create a Nodemailer transporter using SendGrid's SMTP details
const transporter = nodemailer_1.default.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,
    auth: {
        user: "apikey", // This is the literal string "apikey"
        pass: process.env.SENDGRID_API_KEY, // Your API key from Step 3
    },
});
/**
 * Sends an email using the configured SendGrid transporter.
 */
const sendEmail = (options) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mailOptions = {
            from: `"ProfVet" <abhijeetkatkade11@gmail.com>`, // The sender you verified in Step 2
            to: options.to,
            subject: options.subject,
            html: options.html,
        };
        const info = yield transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return info;
    }
    catch (error) {
        console.error("Error sending email via SendGrid:", error);
        throw new Error("Failed to send email.");
    }
});
exports.sendEmail = sendEmail;
