import nodemailer from "nodemailer";

/**
 * Create a test account and transporter for development environment
 */
export const createTestTransporter = async () => {
  // Generate test SMTP service account from ethereal.email
  const testAccount = await nodemailer.createTestAccount();
  console.log("Created Ethereal test account:", testAccount.user);

  // Create a reusable transporter object using the default SMTP transport
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

/**
 * Send email with optional fallback for development
 */
export const sendEmail = async (options) => {
  const { to, subject, html } = options;

  try {
    let transporter;
    let info;

    if (process.env.NODE_ENV === "production") {
      // In production, use configured email service
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"IPD Portal" <noreply@ipdportal.com>',
        to,
        subject,
        html,
      });

      return { success: true, messageId: info.messageId };
    } else {
      // In development, use Ethereal test accounts
      transporter = await createTestTransporter();

      info = await transporter.sendMail({
        from: '"IPD Portal" <test@ipdportal.com>',
        to,
        subject,
        html,
      });

      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info),
      };
    }
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, error: error.message };
  }
};
