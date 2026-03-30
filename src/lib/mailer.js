import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendResetEmail(to, resetUrl) {
  await transporter.sendMail({
    from: `"Black Army Treasury" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Réinitialisation de mot de passe — BA Treasury',
    html: `
      <div style="font-family:system-ui,sans-serif;background:#000;color:#fff;padding:32px;border-radius:12px;max-width:480px;margin:0 auto">
        <h2 style="color:#fff;margin-bottom:8px">Réinitialisation de mot de passe</h2>
        <p style="color:#a1a1aa;margin-bottom:24px">Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe. Ce lien expire dans <strong style="color:#fff">1 heure</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#b91c1c;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;margin-bottom:24px">
          Réinitialiser le mot de passe
        </a>
        <p style="color:#52525b;font-size:12px">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.<br/>Lien valide 1 heure.</p>
      </div>
    `,
  });
}
