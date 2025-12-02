import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST || '';
const port = parseInt(process.env.SMTP_PORT || '587');
const secure = (process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
const user = process.env.SMTP_USER || '';
const pass = process.env.SMTP_PASS || '';
const from = process.env.MAIL_FROM || 'no-reply@example.com';

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: user ? { user, pass } : undefined,
});

export async function sendMail(to: string, subject: string, html: string) {
  if (!host) return;
  await transporter.sendMail({ from, to, subject, html });
}
