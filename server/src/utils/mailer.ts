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
  pool: true,
  maxConnections: 3,
  maxMessages: 100,
  connectionTimeout: parseInt(process.env.SMTP_CONN_TIMEOUT || '10000'),
  socketTimeout: parseInt(process.env.SMTP_SOCKET_TIMEOUT || '10000'),
  greetingTimeout: parseInt(process.env.SMTP_GREET_TIMEOUT || '10000'),
});

export async function sendMail(to: string, subject: string, html: string) {
  if (!host) return false;
  try {
    await transporter.sendMail({ from, to, subject, html });
    return true;
  } catch (err) {
    console.error('SMTP send error:', err);
    return false;
  }
}
