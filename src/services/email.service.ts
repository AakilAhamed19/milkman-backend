/**
 * Brevo Transactional Email Service
 * Uses Brevo REST API v3 (https://api.brevo.com/v3/smtp/email)
 * This uses pure HTTPS (port 443), so it NEVER gets blocked by firewalls or cloud hosting ports!
 */

function getApiKey(): string {
    const key = process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY || process.env.EMAIL_PASS;
    if (!key) {
        throw new Error("Brevo API key (BREVO_API_KEY) is missing in environment variables");
    }
    return key.trim();
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

async function sendViaBrevoApi(payload: {
    to: { email: string; name?: string }[];
    subject: string;
    htmlContent: string;
    textContent?: string;
}) {
    const apiKey = getApiKey();
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

    await sendViaBrevoApi({
        to: [{ email: email.trim().toLowerCase() }],
        subject: "PaalKhata - Email Verification OTP",
        htmlContent,
        textContent,
    });

    console.log(`Brevo API: OTP email sent successfully to ${email}`);
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

    await sendViaBrevoApi({
        to: [{ email: email.trim().toLowerCase(), name: name.trim() }],
        subject: "PaalKhata - Your Employee Login Credentials",
        htmlContent,
        textContent,
    });

    console.log(`Brevo API: Employee credentials email sent to ${email}`);
}
