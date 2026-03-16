import { describe, expect, it } from 'vitest';
import { calculateSplits } from '../calculator';

describe('calculateSplits', () => {
  it('returns zeroed result when participant list is empty', () => {
    const result = calculateSplits([], [{ paidBy: 'x', amount: 100 }]);

    expect(result.totalExpense).toBe(0);
    expect(result.perPerson).toBe(0);
    expect(result.transactions).toEqual([]);
    expect(result.balances).toEqual([]);
  });

  it('creates a single transaction for a simple two-person split', () => {
    const participants = [
      { id: 'a', name: 'Ali' },
      { id: 'v', name: 'Veli' },
    ];
    const expenses = [{ id: 'e1', paidBy: 'a', amount: 100 }];

    const result = calculateSplits(participants, expenses);

    expect(result.totalExpense).toBe(100);
    expect(result.perPerson).toBe(50);
    expect(result.transactions).toEqual([{ from: 'Veli', to: 'Ali', amount: 50 }]);
  });

  it('handles decimal amounts and settles all balances consistently', () => {
    const participants = [
      { id: 'a', name: 'Ali' },
      { id: 'v', name: 'Veli' },
      { id: 'c', name: 'Can' },
    ];
    const expenses = [
      { id: 'e1', paidBy: 'a', amount: 100.1 },
      { id: 'e2', paidBy: 'v', amount: 50.2 },
    ];

    const result = calculateSplits(participants, expenses);

    expect(result.totalExpense).toBe(150.3);
    expect(result.perPerson).toBe(50.1);
    expect(result.transactions).toEqual([
      { from: 'Can', to: 'Ali', amount: 50 },
      { from: 'Can', to: 'Veli', amount: 0.1 },
    ]);

    const balanceSum = result.balances.reduce((sum, item) => sum + item.balance, 0);
    expect(Math.abs(balanceSum)).toBeLessThanOrEqual(0.01);
  });
});
