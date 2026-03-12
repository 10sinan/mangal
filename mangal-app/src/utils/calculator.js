export function calculateSplits(participants, expenses) {
  const n = participants.length;
  if (n === 0) return { totalExpense: 0, perPerson: 0, transactions: [], balances: [] };

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const perPerson = Math.round(totalExpense / n);

  const paid = {};
  participants.forEach((p) => (paid[p.id] = 0));
  expenses.forEach((e) => {
    if (paid[e.paidBy] !== undefined) paid[e.paidBy] += e.amount;
  });

  const balances = participants.map((p) => ({
    id: p.id,
    name: p.name,
    totalPaid: Math.round(paid[p.id]),
    balance: Math.round(paid[p.id] - perPerson),
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

  while (ci < cred.length && di < debt.length) {
    const amount = Math.min(cred[ci].balance, -debt[di].balance);
    if (amount > 0) {
      transactions.push({ from: debt[di].name, to: cred[ci].name, amount });
    }
    cred[ci].balance -= amount;
    debt[di].balance += amount;
    if (cred[ci].balance === 0) ci++;
    if (debt[di].balance === 0) di++;
  }

  return { totalExpense, perPerson, transactions, balances };
}
