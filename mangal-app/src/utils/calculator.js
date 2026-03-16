export function calculateSplits(participants, expenses) {
  const n = participants.length;
  if (n === 0) return { totalExpense: 0, perPerson: 0, transactions: [], balances: [] };

  const toMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  const totalExpense = toMoney(expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0));
  const perPerson = toMoney(totalExpense / n);

  const paid = {};
  participants.forEach((p) => (paid[p.id] = 0));
  expenses.forEach((e) => {
    if (paid[e.paidBy] !== undefined) paid[e.paidBy] = toMoney(paid[e.paidBy] + Number(e.amount || 0));
  });

  const balances = participants.map((p) => ({
    id: p.id,
    name: p.name,
    totalPaid: toMoney(paid[p.id]),
    balance: toMoney(paid[p.id] - perPerson),
  }));

  const cred = balances
    .filter((b) => b.balance > 0)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.balance - a.balance);
  const debt = balances
    .filter((b) => b.balance < 0)
    .map((b) => ({ ...b }))
    .sort((a, b) => a.balance - b.balance);

  const transactions = [];
  let ci = 0, di = 0;
  const EPSILON = 0.009;

  while (ci < cred.length && di < debt.length) {
    const amount = toMoney(Math.min(cred[ci].balance, -debt[di].balance));
    if (amount > 0) {
      transactions.push({ from: debt[di].name, to: cred[ci].name, amount });
    }
    cred[ci].balance = toMoney(cred[ci].balance - amount);
    debt[di].balance = toMoney(debt[di].balance + amount);
    if (Math.abs(cred[ci].balance) <= EPSILON) {
      cred[ci].balance = 0;
      ci++;
    }
    if (Math.abs(debt[di].balance) <= EPSILON) {
      debt[di].balance = 0;
      di++;
    }
  }

  return { totalExpense, perPerson, transactions, balances };
}
