/**
 * Brevo & Nodemailer Hybrid Email Service
 * 1. If BREVO_API_KEY (starts with "xkeysib-") is present -> Uses Brevo REST API v3
 * 2. If SMTP / Gmail credentials are present -> Uses direct Nodemailer SMTP (supports Gmail App Password)
 */
import nodemailer from "nodemailer";

function isBrevoApiKeyPresent(): boolean {
    const key = process.env.BREVO_API_KEY;
    return typeof key === "string" && key.trim().startsWith("xkeysib-");
}

function getSender() {
    const email = (
        process.env.BREVO_SENDER_EMAIL ||
        process.env.EMAIL_USER ||
        "akaakil48@gmail.com"
    ).trim();

    return {
        name: "PaalKhata",
        email: email,
    };
}

// Brevo REST API Sender
async function sendViaBrevoApi(payload: {
    to: { email: string; name?: string }[];
    subject: string;
    htmlContent: string;
    textContent?: string;
}) {
    const apiKey = process.env.BREVO_API_KEY!.trim();
    const sender = getSender();

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "accept": "application/json",
            "api-key": apiKey,
            "content-type": "application/json",
        },
        body: JSON.stringify({
            sender,
            to: payload.to,
            subject: payload.subject,
            htmlContent: payload.htmlContent,
            textContent: payload.textContent,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Brevo API error response:", response.status, errorBody);
        throw new Error(`Brevo API Error (${response.status}): ${errorBody}`);
    }

    const result = await response.json();
    return result;
}

// Nodemailer SMTP Transporter (Fallback for local / Gmail)
function createSmtpTransporter() {
    const emailUser = (process.env.EMAIL_USER || "akaakil48@gmail.com").trim();
    // Strip any accidental spaces from Google App Password
    const emailPass = (process.env.EMAIL_PASS || "").replace(/\s+/g, "");

    if (!emailUser || !emailPass) {
        throw new Error("Email credentials (BREVO_API_KEY or EMAIL_USER & EMAIL_PASS) are missing");
    }

    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: emailUser,
            pass: emailPass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
    });
}

// Universal Sender: Uses Brevo API if configured, else Gmail Nodemailer
async function sendEmailUniversal(payload: {
    toEmail: string;
    toName?: string;
    subject: string;
    htmlContent: string;
    textContent: string;
}) {
    if (isBrevoApiKeyPresent()) {
        try {
            await sendViaBrevoApi({
                to: payload.toName ? [{ email: payload.toEmail.trim().toLowerCase(), name: payload.toName }] : [{ email: payload.toEmail.trim().toLowerCase() }],
                subject: payload.subject,
                htmlContent: payload.htmlContent,
                textContent: payload.textContent,
            });
            console.log(`[Brevo API] Email sent successfully to ${payload.toEmail}`);
            return;
        } catch (err) {
            console.warn(`[Brevo API] failed, falling back to SMTP:`, err);
        }
    }

    // SMTP Fallback
    const transporter = createSmtpTransporter();
    const sender = getSender();

    await transporter.sendMail({
        from: `"PaalKhata" <${sender.email}>`,
        to: payload.toEmail,
        subject: payload.subject,
        text: payload.textContent,
        html: payload.htmlContent,
    });

    console.log(`[SMTP] Email sent successfully to ${payload.toEmail}`);
}

// ADMIN REGISTRATION OTP EMAIL
export async function sendOtpEmail(
    email: string,
    otp: string
) {
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Welcome to PaalKhata!</h2>
            <p>Your email verification OTP is:</p>
            <h1 style="letter-spacing: 8px; color: #2563eb;">
                ${otp}
            </h1>
            <p>This OTP expires in 5 minutes.</p>
            <p>Please do not share this OTP with anyone.</p>
            <p>Thank you,<br/>PaalKhata Team</p>
        </div>
    `;

    const textContent = `Your PaalKhata verification OTP is ${otp}. It expires in 5 minutes. Do not share this OTP with anyone.`;

    await sendEmailUniversal({
        toEmail: email,
        subject: "PaalKhata - Email Verification OTP",
        htmlContent,
        textContent,
    });
}

// EMPLOYEE TEMPORARY LOGIN CREDENTIALS EMAIL
export async function sendEmployeeCredentialsEmail(
    name: string,
    email: string,
    temporaryPassword: string
) {
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Welcome to PaalKhata, ${name}!</h2>

            <p>Your employee account has been created by your Admin.</p>

            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
                <p><strong>Login Email:</strong> ${email}</p>
                <p><strong>Temporary Password:</strong></p>
                <h2 style="color: #2563eb;">
                    ${temporaryPassword}
                </h2>
            </div>

            <p>Please log in and change your temporary password immediately.</p>

            <p>Do not share your login credentials with anyone.</p>

            <p>Thank you,<br/>PaalKhata Team</p>
        </div>
    `;

    const textContent = `
Hello ${name},

Your PaalKhata employee account has been created by your Admin.

Login Email: ${email}
Temporary Password: ${temporaryPassword}

Please log in and change your temporary password immediately.

Thank you,
PaalKhata Team
    `.trim();

    await sendEmailUniversal({
        toEmail: email,
        toName: name,
        subject: "PaalKhata - Your Employee Login Credentials",
        htmlContent,
        textContent,
    });
}

