
import nodemailer from "nodemailer";

// CREATE EMAIL TRANSPORTER
function createEmailTransporter() {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
        throw new Error("Gmail SMTP credentials are missing");
    }

    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: emailUser,
            pass: emailPass,
        },
    });
}

// ADMIN REGISTRATION OTP EMAIL
export async function sendOtpEmail(
    email: string,
    otp: string
) {
    const emailUser = process.env.EMAIL_USER;

    if (!emailUser) {
        throw new Error("EMAIL_USER is missing");
    }

    const transporter = createEmailTransporter();

    await transporter.sendMail({
        from: `"PaalKhata" <${emailUser}>`,
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

    console.log(`OTP email sent successfully to ${email}`);
}

// EMPLOYEE TEMPORARY LOGIN CREDENTIALS EMAIL
export async function sendEmployeeCredentialsEmail(
    name: string,
    email: string,
    temporaryPassword: string
) {
    const emailUser = process.env.EMAIL_USER;

    if (!emailUser) {
        throw new Error("EMAIL_USER is missing");
    }

    const transporter = createEmailTransporter();

    await transporter.sendMail({
        from: `"PaalKhata" <${emailUser}>`,
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

    console.log(`Employee credentials email sent to ${email}`);
}
