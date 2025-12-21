const nodemailer = require('nodemailer');
const { ApiError } = require('../api/middlewares/errorHandler');
const logger = require('../utils/logger');
const { FEATURES, APPOINTMENT_STATUS } = require('../config/constants');

/**
 * Email service for sending password reset emails
 */

// Create transporter (reusable)
const createTransporter = () => {
    // Check if email is disabled via feature flag
    if (!FEATURES.EMAIL_ENABLED) {
        logger.info('Email sending is disabled via EMAIL_ENABLED=false');
        return null;
    }

    // Check if we have email configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
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
    const transporter = createTransporter();

    if (!transporter) {
        // Email not configured - in development, check console or email service logs
        return;
    }

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
    } catch (error) {
        logger.error('Failed to send password reset email', error);
        throw new ApiError(500, 'Failed to send password reset email. Please try again later.');
    }
};

/**
 * Send email verification email
 * @param {string} email - Recipient email
 * @param {string} token - Verification token
 * @param {string} firstName - User's first name
 */
const sendVerificationEmail = async (email, token, firstName) => {
    const transporter = createTransporter();

    if (!transporter) {
        // Email not configured - in development, check console or email service logs
        return;
    }

    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Hesabınızı Doğrulayın - Agilion MedComm',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0e2b4b;">Hoş Geldiniz ${firstName}!</h2>
                <p>Agilion MedComm'a kayıt olduğunuz için teşekkür ederiz.</p>
                <p>Hesabınızı güvenle kullanabilmek için lütfen e-posta adresinizi doğrulayın:</p>
                <div style="margin: 30px 0;">
                    <a href="${verifyUrl}" 
                       style="background-color: #45b5c4; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
                        Hesabımı Doğrula
                    </a>
                </div>
                <p style="color: #666; font-size: 14px;">Bu bağlantı 24 saat geçerlidir.</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        logger.error('Failed to send verification email', error);
        // Don't throw - email verification failure shouldn't block registration
    }
};

/**
 * Send contact reply email
 * @param {string} email - Recipient email
 * @param {string} name - User's name
 * @param {string} subject - Original subject
 * @param {string} replyMessage - Admin's reply message
 */
const sendContactReplyEmail = async (email, name, subject, replyMessage) => {
    const transporter = createTransporter();

    if (!transporter) {
        // Email not configured - in development, check console or email service logs
        return;
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Re: ${subject} - Agilion MedComm`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0e2b4b;">İletişim Formunuza Yanıt</h2>
                <p>Merhaba ${name},</p>
                <p>Bizimle iletişime geçtiğiniz için teşekkür ederiz. İletinize yanıtımız aşağıdadır:</p>
                <div style="background-color: #f5f5f5; padding: 20px; border-left: 4px solid #45b5c4; margin: 20px 0;">
                    <p style="margin: 0; white-space: pre-wrap;">${replyMessage}</p>
                </div>
                <p style="color: #666;">Başka sorularınız varsa, lütfen bizimle iletişime geçmekten çekinmeyin.</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">© 2025 Agilion MedComm. Tüm hakları saklıdır.</p>
            </div>
        `,
        text: `
Merhaba ${name},

Bizimle iletişime geçtiğiniz için teşekkür ederiz. İletinize yanıtımız aşağıdadır:

${replyMessage}

Başka sorularınız varsa, lütfen bizimle iletişime geçmekten çekinmeyin.

© 2025 Agilion MedComm
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        logger.error('Failed to send contact reply email', error);
        throw new ApiError(500, 'Failed to send reply email. Please try again later.');
    }
};

/**
 * Send appointment notification email
 * @param {string} email - Patient's email
 * @param {object} appointmentDetails - Appointment details
 * @param {string} appointmentDetails.patientFirstName - Patient's first name
 * @param {string} appointmentDetails.patientLastName - Patient's last name
 * @param {string} appointmentDetails.doctorName - Doctor's full name
 * @param {string} appointmentDetails.department - Doctor's specialization/department
 * @param {string} appointmentDetails.date - Appointment date (DD.MM.YYYY)
 * @param {string} appointmentDetails.time - Appointment time (HH:MM)
 * @param {string} appointmentDetails.status - Appointment status
 */
const sendAppointmentNotificationEmail = async (email, appointmentDetails) => {
    const transporter = createTransporter();

    if (!transporter) {
        // Email not configured - in development, check console or email service logs
        return;
    }

    const {
        patientFirstName,
        patientLastName,
        doctorName,
        department,
        date,
        time,
        status,
    } = appointmentDetails;

    const statusText = status === APPOINTMENT_STATUS.APPROVED ? 'Onaylandı' : 'Oluşturuldu';

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Randevu ${statusText} - Agilion MedComm`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0e2b4b;">Randevunuz ${statusText}</h2>
                <p>Merhaba ${patientFirstName} ${patientLastName},</p>
                <p>Randevunuz başarıyla ${statusText.toLowerCase()}. Detaylar aşağıdadır:</p>
                <div style="background-color: #f5f5f5; padding: 20px; border-left: 4px solid #45b5c4; margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #666; width: 120px;"><strong>Doktor:</strong></td>
                            <td style="padding: 8px 0; color: #333;">${doctorName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;"><strong>Klinik:</strong></td>
                            <td style="padding: 8px 0; color: #333;">${department}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;"><strong>Tarih:</strong></td>
                            <td style="padding: 8px 0; color: #333;">${date}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;"><strong>Saat:</strong></td>
                            <td style="padding: 8px 0; color: #333;">${time}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;"><strong>Durum:</strong></td>
                            <td style="padding: 8px 0; color: #45b5c4; font-weight: bold;">${statusText}</td>
                        </tr>
                    </table>
                </div>
                <p style="color: #666;">Randevunuza zamanında gelmenizi rica ederiz. Herhangi bir değişiklik için lütfen bizimle iletişime geçin.</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">© 2025 Agilion MedComm. Tüm hakları saklıdır.</p>
            </div>
        `,
        text: `
Merhaba ${patientFirstName} ${patientLastName},

Randevunuz başarıyla ${statusText.toLowerCase()}. Detaylar aşağıdadır:

Doktor: ${doctorName}
Klinik: ${department}
Tarih: ${date}
Saat: ${time}
Durum: ${statusText}

Randevunuza zamanında gelmenizi rica ederiz. Herhangi bir değişiklik için lütfen bizimle iletişime geçin.

© 2025 Agilion MedComm
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        logger.error('Failed to send appointment notification email', error);
        throw new ApiError(500, 'Failed to send appointment notification email.');
    }
};

/**
 * Send appointment cancellation email
 * @param {string} email - Patient's email
 * @param {object} appointmentDetails - Appointment details
 * @param {string} appointmentDetails.patientFirstName - Patient's first name
 * @param {string} appointmentDetails.patientLastName - Patient's last name
 * @param {string} appointmentDetails.doctorName - Doctor's full name
 * @param {string} appointmentDetails.department - Doctor's specialization/department
 * @param {string} appointmentDetails.date - Appointment date (DD.MM.YYYY)
 * @param {string} appointmentDetails.time - Appointment time (HH:MM)
 */
const sendAppointmentCancellationEmail = async (email, appointmentDetails) => {
    const transporter = createTransporter();

    if (!transporter) {
        // Email not configured - in development, check console or email service logs
        return;
    }

    const {
        patientFirstName,
        patientLastName,
        doctorName,
        department,
        date,
        time,
    } = appointmentDetails;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Randevunuz İptal Edildi - Agilion MedComm',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc3545;">Randevunuz İptal Edildi</h2>
                <p>Merhaba ${patientFirstName} ${patientLastName},</p>
                <p>Aşağıdaki randevunuz iptal edilmiştir:</p>
                <div style="background-color: #f5f5f5; padding: 20px; border-left: 4px solid #dc3545; margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #666; width: 120px;"><strong>Doktor:</strong></td>
                            <td style="padding: 8px 0; color: #333;">${doctorName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;"><strong>Klinik:</strong></td>
                            <td style="padding: 8px 0; color: #333;">${department}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;"><strong>Tarih:</strong></td>
                            <td style="padding: 8px 0; color: #333;">${date}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;"><strong>Saat:</strong></td>
                            <td style="padding: 8px 0; color: #333;">${time}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;"><strong>Durum:</strong></td>
                            <td style="padding: 8px 0; color: #dc3545; font-weight: bold;">İptal Edildi</td>
                        </tr>
                    </table>
                </div>
                <p style="color: #666;">Yeni bir randevu almak için lütfen sistemimizi kullanın veya bizimle iletişime geçin.</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">© 2025 Agilion MedComm. Tüm hakları saklıdır.</p>
            </div>
        `,
        text: `
Merhaba ${patientFirstName} ${patientLastName},

Aşağıdaki randevunuz iptal edilmiştir:

Doktor: ${doctorName}
Klinik: ${department}
Tarih: ${date}
Saat: ${time}
Durum: İptal Edildi

Yeni bir randevu almak için lütfen sistemimizi kullanın veya bizimle iletişime geçin.

© 2025 Agilion MedComm
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        logger.error('Failed to send appointment cancellation email', error);
        throw new ApiError(500, 'Failed to send appointment cancellation email.');
    }
};

/**
 * Send 24-hour appointment reminder email
 * @param {string} email - Patient's email
 * @param {object} appointmentDetails - Appointment details
 * @param {string} appointmentDetails.patientFirstName - Patient's first name
 * @param {string} appointmentDetails.patientLastName - Patient's last name
 * @param {string} appointmentDetails.doctorName - Doctor's full name
 * @param {string} appointmentDetails.department - Doctor's specialization/department
 * @param {Date} appointmentDetails.appointmentDateTime - Appointment date/time as Date object
 */
const sendAppointmentReminderEmail = async (email, appointmentDetails) => {
    const transporter = createTransporter();

    if (!transporter) {
        // Email not configured - in development, check console or email service logs
        return;
    }

    const {
        patientFirstName,
        patientLastName,
        doctorName,
        department,
        appointmentDateTime,
    } = appointmentDetails;

    // Format date and time using tr-TR locale and Europe/Istanbul timezone
    const formattedDate = appointmentDateTime.toLocaleDateString('tr-TR', {
        timeZone: 'Europe/Istanbul',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

    const formattedTime = appointmentDateTime.toLocaleTimeString('tr-TR', {
        timeZone: 'Europe/Istanbul',
        hour: '2-digit',
        minute: '2-digit',
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Randevu Hatırlatma - Yarın Randevunuz Var! - Agilion MedComm',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0e2b4b;">🔔 Randevu Hatırlatması</h2>
                <p>Merhaba ${patientFirstName} ${patientLastName},</p>
                <p>Yarın randevunuz olduğunu hatırlatmak istiyoruz. Lütfen randevunuza zamanında gelmeyi unutmayın.</p>
                <div style="background-color: #fff3cd; padding: 20px; border-left: 4px solid #ffc107; margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #666; width: 120px;"><strong>Doktor:</strong></td>
                            <td style="padding: 8px 0; color: #333;">${doctorName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;"><strong>Klinik:</strong></td>
                            <td style="padding: 8px 0; color: #333;">${department}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;"><strong>Tarih:</strong></td>
                            <td style="padding: 8px 0; color: #333;">${formattedDate}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;"><strong>Saat:</strong></td>
                            <td style="padding: 8px 0; color: #333; font-size: 18px; font-weight: bold;">${formattedTime}</td>
                        </tr>
                    </table>
                </div>
                <div style="background-color: #e7f3ff; padding: 15px; border-radius: 4px; margin: 20px 0;">
                    <p style="margin: 0; color: #0c5460;">
                        <strong>💡 Hatırlatma:</strong> Randevunuza 10 dakika erken gelmenizi öneririz. Yanınızda kimlik belgenizi getirmeyi unutmayın.
                    </p>
                </div>
                <p style="color: #666;">Herhangi bir değişiklik veya iptal için lütfen bizimle iletişime geçin.</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">© 2025 Agilion MedComm. Tüm hakları saklıdır.</p>
            </div>
        `,
        text: `
🔔 Randevu Hatırlatması

Merhaba ${patientFirstName} ${patientLastName},

Yarın randevunuz olduğunu hatırlatmak istiyoruz. Lütfen randevunuza zamanında gelmeyi unutmayın.

Randevu Detayları:
- Doktor: ${doctorName}
- Klinik: ${department}
- Tarih: ${formattedDate}
- Saat: ${formattedTime}

💡 Hatırlatma: Randevunuza 10 dakika erken gelmenizi öneririz. Yanınızda kimlik belgenizi getirmeyi unutmayın.

Herhangi bir değişiklik veya iptal için lütfen bizimle iletişime geçin.

© 2025 Agilion MedComm
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        logger.info(`Reminder email sent successfully to ${email}`);
    } catch (error) {
        logger.error('Failed to send appointment reminder email', error);
        throw new ApiError(500, 'Failed to send appointment reminder email.');
    }
};

module.exports = {
    sendPasswordResetEmail,
    sendVerificationEmail,
    sendContactReplyEmail,
    sendAppointmentNotificationEmail,
    sendAppointmentCancellationEmail,
    sendAppointmentReminderEmail,
};
