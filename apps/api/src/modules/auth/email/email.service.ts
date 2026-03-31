import { Injectable, Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly transporter: Transporter;
  private readonly fromAddress: string;
  private readonly frontendUrl: string;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.fromAddress = process.env.SMTP_FROM ?? 'no-reply@dentalsoft.com';
    this.frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT ?? '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    this.transporter = createTransport({
      host: smtpHost ?? 'localhost',
      port: smtpPort,
      secure: smtpPort === 465,
      auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
    });
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0;">
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #0f172a;">
                DentalSoft
              </h1>
              <p style="margin: 0 0 24px; font-size: 14px; color: #64748b;">
                Sistema de gestión odontológica
              </p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 0 0 24px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #0f172a;">
                Recuperación de contraseña
              </h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #334155;">
                Recibimos una solicitud para restablecer su contraseña. Haga clic en el botón siguiente para crear una nueva:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 24px;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 12px 32px; background-color: #0d9488; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Restablecer contraseña
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 16px; font-size: 14px; line-height: 20px; color: #64748b;">
                Si el botón no funciona, copie y pegue el siguiente enlace en su navegador:
              </p>
              <p style="margin: 0 0 24px; font-size: 14px; word-break: break-all;">
                <a href="${resetUrl}" style="color: #0d9488;">${resetUrl}</a>
              </p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 0 0 24px;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #94a3b8;">
                Este enlace expira en 1 hora. Si no solicitó este cambio, ignore este correo.
              </p>
              <p style="margin: 0; font-size: 13px; color: #94a3b8;">
                Este es un correo automático, no responda a esta dirección.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: `"DentalSoft" <${this.fromAddress}>`,
        to,
        subject: 'Recuperación de contraseña — DentalSoft',
        html,
      });
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${to}: ${error}`);
      throw error;
    }
  }
}
