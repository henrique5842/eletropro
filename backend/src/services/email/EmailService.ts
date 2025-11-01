import nodemailer from 'nodemailer';

export class EmailService {
  private static transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  static async sendVerificationCode(email: string, code: string) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verificação de Email',
      html: `
        <h1>Verificação de Email</h1>
        <p>Seu código de verificação é: <strong>${code}</strong></p>
        <p>Este código expira em 15 minutos.</p>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  static async sendResetCode(email: string, resetCode: string) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Recuperação de Senha - CRYPTIFY',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #171a21; color: #c7d5e0; padding: 40px; text-align: center;">
          <div style="max-width: 600px; margin: auto; background-color: #1b2838; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.3);">
            <h2 style="color: #66c0f4; margin-bottom: 24px;">Recuperação de Senha</h2>
            <p style="font-size: 16px;">Você solicitou a recuperação da sua senha.</p>
            <p style="font-size: 18px; margin: 20px 0;">Use o código abaixo para redefinir sua senha:</p>
            <div style="font-size: 32px; font-weight: bold; color: #ffffff; background-color: #2a475e; padding: 12px 24px; border-radius: 6px; display: inline-block; margin: 20px 0;">
              ${resetCode}
            </div>
            <p style="font-size: 14px; margin-top: 30px; color: #aab8c2;">Este código expira em 15 minutos.</p>
            <hr style="border-color: #32475d; margin: 40px 0;">
            <p style="font-size: 12px; color: #6c7a89;">Se você não solicitou essa recuperação, apenas ignore este e-mail.</p>
            <p style="font-size: 12px; color: #6c7a89;">&copy; ${new Date().getFullYear()} CRYPTIFY</p>
          </div>
        </div>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }
}