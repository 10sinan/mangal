// Supports iOS: [12.03.2026 20:30] Name: Message
// Supports Android TR: 12.03.2026 20:30 - Name: Message
// Supports Android EN: 12/03/2026, 8:30 PM - Name: Message

const RE_IOS = /^\[(\d{2}[./]\d{2}[./]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?)\]\s+([^:]+):\s+(.+)$/;
const RE_ANDROID_TR = /^(\d{2}\.\d{2}\.\d{2,4})[,\s]+(\d{2}:\d{2})\s+-\s+([^:]+):\s+(.+)$/;
const RE_ANDROID_EN = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s+(\d{1,2}:\d{2}(?:\s*[AP]M)?)\s+-\s+([^:]+):\s+(.+)$/;

function parseLine(line) {
  let m = line.match(RE_IOS) || line.match(RE_ANDROID_TR) || line.match(RE_ANDROID_EN);
  if (!m) return null;
  return { date: m[1], time: m[2], name: m[3].trim(), message: m[4].trim() };
}

const RE_CURRENCY = /(\d[\d.,]*)\s*(TL|lira)\b/i;
const RE_FINANCIAL_VERB = /\b(verdim|aldım|harcadım|ödedim|ödüyorum|gönderdim|yatırdım|öde[rn]?|borç)\b/i;
const RE_INVALID_CTX = /\b\d+\s*(kere|tane|defa|kez|saniye|dakika|saat|gün|yıl|ay|kişi|numara|no)\b/i;

function normalizeAmount(raw) {
  if (!raw) return null;
  let s = String(raw).trim().replace(/\s+/g, '');
  const hasDot = s.includes('.');
  const hasComma = s.includes(',');

  if (hasDot && hasComma) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (hasComma) {
    const parts = s.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      s = `${parts[0].replace(/,/g, '')}.${parts[1]}`;
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (hasDot) {
    const parts = s.split('.');
    if (!(parts.length === 2 && parts[1].length <= 2)) {
      s = s.replace(/\./g, '');
    }
  }

  const val = Number.parseFloat(s);
  if (!Number.isFinite(val) || val <= 0) return null;
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

function extractAmount(message) {
  // Explicit currency match first
  const cm = message.match(RE_CURRENCY);
  if (cm) return normalizeAmount(cm[1]);

  // Financial verb + number, but not in invalid context
  if (RE_FINANCIAL_VERB.test(message) && !RE_INVALID_CTX.test(message)) {
    const nm = message.match(/\b(\d[\d.,]*)\b/);
    if (nm) return normalizeAmount(nm[1]);
  }

  return null;
}

export function parseWhatsAppChat(text) {
  const results = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const msg = parseLine(line);
    if (!msg) continue;

    const hasFinancial =
      RE_CURRENCY.test(msg.message) ||
      (RE_FINANCIAL_VERB.test(msg.message) && !RE_INVALID_CTX.test(msg.message));
    if (!hasFinancial) continue;

    const amount = extractAmount(msg.message);
    if (!amount || amount <= 0 || amount > 500000) continue;

    results.push({
      id: crypto.randomUUID(),
      name: msg.name,
      message: msg.message,
      date: msg.date,
      amount,
      selected: true,
    });
  }
  return results;
}
