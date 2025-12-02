import nodemailer from 'nodemailer';
import { google } from 'googleapis';

const host = process.env.SMTP_HOST || '';
const port = parseInt(process.env.SMTP_PORT || '587');
const secure = (process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
const user = process.env.SMTP_USER || '';
const pass = process.env.SMTP_PASS || '';
const from = process.env.MAIL_FROM || 'no-reply@example.com';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || '').toLowerCase();
const RESEND_REPLY_TO = process.env.RESEND_REPLY_TO || user || undefined;
const GMAIL_USER = process.env.GMAIL_USER || user || '';
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || '';
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || '';
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN || '';

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
  if (!host && !RESEND_API_KEY) return false;
  try {
    if (EMAIL_PROVIDER === 'resend' && RESEND_API_KEY) {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to, subject, html, reply_to: RESEND_REPLY_TO }),
      });
      if (resp.ok) return true;
      const t = await resp.text();
      console.error('Resend error:', t);
    } else if (EMAIL_PROVIDER === 'gmail_api' && GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET && GMAIL_REFRESH_TOKEN && GMAIL_USER) {
      const oAuth2Client = new google.auth.OAuth2(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET);
      oAuth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });
      const accessTokenObj = await oAuth2Client.getAccessToken();
      const accessToken = typeof accessTokenObj === 'string' ? accessTokenObj : accessTokenObj.token || '';
      const raw = Buffer.from(
        `From: ${GMAIL_USER}\nTo: ${to}\nSubject: ${subject}\nReply-To: ${RESEND_REPLY_TO || GMAIL_USER}\nContent-Type: text/html; charset=utf-8\n\n${html}`
      )
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
      await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
      return true;
    } else if (host) {
      await transporter.sendMail({ from, to, subject, html });
      return true;
    }
  } catch (err) {
    console.error('SMTP send error:', err);
  }
  if (RESEND_API_KEY) {
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to, subject, html, reply_to: RESEND_REPLY_TO }),
      });
      if (resp.ok) return true;
      const t = await resp.text();
      console.error('Resend error:', t);
    } catch (e) {
      console.error('Resend send error:', e);
    }
  }
  return false;
}
