import nodemailer from "nodemailer";

// CREATE EMAIL TRANSPORTER (Supports Brevo SMTP or Brevo API Key)
function createEmailTransporter() {
    // Brevo SMTP credentials
    // Host: smtp-relay.brevo.com
    // Port: 587 (TLS) or 465 (SSL)
    // User: Brevo account login email or SMTP login
    // Pass: Brevo Master SMTP key / API key
    const host = process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST || "smtp-relay.brevo.com";
    const port = Number(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT) || 587;
    const user = process.env.BREVO_USER || process.env.BREVO_SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY || process.env.BREVO_PASSWORD || process.env.EMAIL_PASS;

    if (!user || !pass) {
        throw new Error("Brevo SMTP credentials (BREVO_USER and BREVO_API_KEY / BREVO_SMTP_KEY) are missing in environment variables");
    }

    return nodemailer.createTransport({
        host: host.trim(),
        port: port,
        secure: port === 465, // true for 465, false for 587
        auth: {
            user: user.trim(),
            pass: pass.trim(),
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000,
    });
}

function getSenderEmail(): string {
    const sender = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER || process.env.BREVO_USER;
    if (!sender) {
        throw new Error("Sender email (BREVO_SENDER_EMAIL or EMAIL_USER) is missing");
    }
    return sender.trim();
}

// ADMIN REGISTRATION OTP EMAIL
export async function sendOtpEmail(
    email: string,
    otp: string
) {
    const senderEmail = getSenderEmail();
    const transporter = createEmailTransporter();

    await transporter.sendMail({
        from: `"PaalKhata" <${senderEmail}>`,
        to: email,
        subject: "PaalKhata - Email Verification OTP",
        text: `Your PaalKhata verification OTP is ${otp}. It expires in 5 minutes. Do not share this OTP with anyone.`,
        html: `
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
        `,
    });

    console.log(`Brevo: OTP email sent successfully to ${email}`);
}

// EMPLOYEE TEMPORARY LOGIN CREDENTIALS EMAIL
export async function sendEmployeeCredentialsEmail(
    name: string,
    email: string,
    temporaryPassword: string
) {
    const senderEmail = getSenderEmail();
    const transporter = createEmailTransporter();

    await transporter.sendMail({
        from: `"PaalKhata" <${senderEmail}>`,
        to: email,
        subject: "PaalKhata - Your Employee Login Credentials",
        text: `
Hello ${name},

Your PaalKhata employee account has been created by your Admin.

Login Email: ${email}
Temporary Password: ${temporaryPassword}

Please log in and change your temporary password immediately.

Thank you,
PaalKhata Team
        `,
        html: `
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
        `,
    });

    console.log(`Brevo: Employee credentials email sent to ${email}`);
}
