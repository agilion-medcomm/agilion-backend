const nodemailer = require('nodemailer');

/**
 * Email service for sending password reset emails
 */

// Create transporter (reusable)
const createTransporter = () => {
    // Check if we have email configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.warn('Email configuration missing. Password reset emails will not be sent.');
        return null;
    }

    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail', // gmail, outlook, etc.
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD, // Use app-specific password for Gmail
        },
    });
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetToken - Password reset token
 * @param {string} firstName - User's first name
 */
const sendPasswordResetEmail = async (email, resetToken, firstName) => {
    console.log(`[PASSWORD RESET] Request for email: ${email}`);
    
    const transporter = createTransporter();

    if (!transporter) {
        console.error('Email transporter not configured. Cannot send password reset email.');
        // In development, just log the token
        console.log(`Password reset token for ${email}: ${resetToken}`);
        console.log(`Reset URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`);
        return;
    }
    
    console.log(`[PASSWORD RESET] Email transporter configured, attempting to send email...`);

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Şifre Sıfırlama - Agilion MedComm',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Şifre Sıfırlama Talebi</h2>
                <p>Merhaba ${firstName},</p>
                <p>Hesabınız için şifre sıfırlama talebinde bulundunuz. Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
                <div style="margin: 30px 0;">
                    <a href="${resetUrl}" 
                       style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                        Şifremi Sıfırla
                    </a>
                </div>
                <p style="color: #666;">Bu bağlantı 1 saat boyunca geçerlidir.</p>
                <p style="color: #666;">Eğer şifre sıfırlama talebinde bulunmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">© 2025 Agilion MedComm. Tüm hakları saklıdır.</p>
            </div>
        `,
        text: `
Merhaba ${firstName},

Hesabınız için şifre sıfırlama talebinde bulundunuz. Şifrenizi sıfırlamak için aşağıdaki bağlantıyı kullanın:

${resetUrl}

Bu bağlantı 1 saat boyunca geçerlidir.

Eğer şifre sıfırlama talebinde bulunmadıysanız, bu e-postayı görmezden gelebilirsiniz.

© 2025 Agilion MedComm
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[PASSWORD RESET] ✅ Email successfully sent to ${email}`);
    } catch (error) {
        console.error('[PASSWORD RESET] ❌ Error sending email:', error.message);
        console.error('Full error:', error);
        // Log token to console as fallback
        console.log(`[PASSWORD RESET] Fallback - Token for ${email}: ${resetToken}`);
        console.log(`[PASSWORD RESET] Reset URL: ${resetUrl}`);
        throw new Error('Failed to send password reset email.');
    }
};

module.exports = {
    sendPasswordResetEmail,
};
