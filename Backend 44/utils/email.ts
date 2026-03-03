import nodemailer from 'nodemailer';

// This is the interface for the options we'll pass to our email function
interface MailOptions {
    to: string;
    subject: string;
    html: string;
}

// Create a Nodemailer transporter using SendGrid's SMTP details
const transporter = nodemailer.createTransport({
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
export const sendEmail = async (options: MailOptions) => {
    try {
        const mailOptions = {
            from: `"ProfVet" <abhijeetkatkade11@gmail.com>`, // The sender you verified in Step 2
            to: options.to,
            subject: options.subject,
            html: options.html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return info;

    } catch (error) {
        console.error("Error sending email via SendGrid:", error);
        throw new Error("Failed to send email.");
    }
};