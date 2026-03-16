import { describe, expect, it } from 'vitest';
import { parseWhatsAppChat } from '../whatsappParser';

describe('parseWhatsAppChat', () => {
  it('parses iOS format with explicit TL currency', () => {
    const text = '[12.03.2026 20:30] Ali: Et için 250 TL verdim';
    const result = parseWhatsAppChat(text);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Ali');
    expect(result[0].amount).toBe(250);
    expect(result[0].selected).toBe(true);
  });

  it('parses Android TR format with financial verb and numeric amount', () => {
    const text = '12.03.2026 20:30 - Veli: Ben 75 harcadım';
    const result = parseWhatsAppChat(text);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Veli');
    expect(result[0].amount).toBe(75);
  });

  it('supports mixed thousand and decimal separators', () => {
    const text = '[12.03.2026 20:30] Can: Kasaba 1.250,50 TL ödedim';
    const result = parseWhatsAppChat(text);

    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(1250.5);
  });

  it('ignores invalid contextual numbers like repetitions', () => {
    const text = '12.03.2026 20:30 - Ayse: Bugün 3 kere ödedim';
    const result = parseWhatsAppChat(text);

    expect(result).toHaveLength(0);
  });
});
