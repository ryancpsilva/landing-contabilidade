import express from 'express';
import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const WHATSAPP_NUMBER = String(process.env.WHATSAPP_NUMBER || '').replace(/\D/g, '');
const MAX_FORMS_PER_PERSON = Number(process.env.MAX_FORMS_PER_PERSON || 2);
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'submissions.json');

app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

const allowedServices = new Set([
  'Terceirização de Departamento Pessoal',
  'Regularização de MEI',
  'Regularização de IRPF'
]);

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function cleanText(value, max = 1000) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, max);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

async function readSubmissions() {
  try {
    const content = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeSubmissions(submissions) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(submissions, null, 2), 'utf8');
}

function buildWhatsAppMessage({ name, email, phone, service, message }) {
  return [
    'Olá! Vim pelo site da contabilidade e gostaria de atendimento.',
    '',
    `Nome: ${name}`,
    `E-mail: ${email}`,
    `Telefone: ${phone}`,
    `Serviço de interesse: ${service}`,
    '',
    'Mensagem / necessidade:',
    message
  ].join('\n');
}

app.post('/api/contact', async (req, res) => {
  try {
    if (!WHATSAPP_NUMBER) {
      return res.status(500).json({
        ok: false,
        message: 'O WhatsApp da profissional ainda não foi configurado no arquivo .env.'
      });
    }

    const name = cleanText(req.body.name, 80);
    const email = normalizeEmail(req.body.email);
    const phone = cleanText(req.body.phone, 30);
    const service = cleanText(req.body.service, 100);
    const message = cleanText(req.body.message, 2000);
    const consent = req.body.consent === true || req.body.consent === 'true' || req.body.consent === 'on';

    if (name.length < 2) {
      return res.status(400).json({ ok: false, message: 'Informe seu nome.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ ok: false, message: 'Informe um e-mail válido.' });
    }
    if (!isValidPhone(phone)) {
      return res.status(400).json({ ok: false, message: 'Informe um telefone válido com DDD.' });
    }
    if (!allowedServices.has(service)) {
      return res.status(400).json({ ok: false, message: 'Selecione um serviço válido.' });
    }
    if (message.length < 10) {
      return res.status(400).json({ ok: false, message: 'Conte um pouco mais sobre o que você precisa.' });
    }
    if (!consent) {
      return res.status(400).json({ ok: false, message: 'É necessário autorizar o uso dos dados para contato.' });
    }

    const submissions = await readSubmissions();
    const previousCount = submissions.filter((item) => item.email === email).length;

    if (previousCount >= MAX_FORMS_PER_PERSON) {
      return res.status(429).json({
        ok: false,
        limitReached: true,
        message: `Este e-mail já atingiu o limite de ${MAX_FORMS_PER_PERSON} solicitações pelo site.`
      });
    }

    const entry = {
      id: crypto.randomUUID(),
      name,
      email,
      phone,
      service,
      message,
      createdAt: new Date().toISOString()
    };

    submissions.push(entry);
    await writeSubmissions(submissions);

    const text = buildWhatsAppMessage(entry);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

    return res.status(201).json({
      ok: true,
      remaining: MAX_FORMS_PER_PERSON - previousCount - 1,
      whatsappUrl,
      message: 'Solicitação registrada. Abrindo o WhatsApp para concluir o atendimento.'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      message: 'Ocorreu um erro ao registrar sua solicitação. Tente novamente.'
    });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use((_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Landing page disponível em http://localhost:${PORT}`);
});
