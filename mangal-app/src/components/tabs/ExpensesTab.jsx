export default function ExpensesTab({
  form,
  setForm,
  addExpense,
  participants,
  addPayerRow,
  removePayerRow,
  updatePayer,
  expenses,
  removeExpense,
  result,
}) {
  return (
    <div className="space-y-4">
      <form onSubmit={addExpense} className="bg-gray-900 rounded-xl p-4 space-y-3">
        <input
          type="text"
          placeholder="Açıklama (et, içecek, kömür...)"
          value={form.desc}
          onChange={(e) => setForm((state) => ({ ...state, desc: e.target.value }))}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition"
        />

        <div className="flex bg-gray-800 rounded-xl p-1 gap-1">
          <button
            type="button"
            onClick={() => setForm((state) => ({ ...state, multiPayer: false }))}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
              !form.multiPayer ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Tek Kişi Ödedi
          </button>
          <button
            type="button"
            onClick={() => setForm((state) => ({ ...state, multiPayer: true }))}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
              form.multiPayer ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Birden Fazla Ödedi
          </button>
        </div>

        {!form.multiPayer ? (
          <div className="flex gap-2">
            <select
              value={form.paidBy}
              onChange={(e) => setForm((state) => ({ ...state, paidBy: e.target.value }))}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition"
            >
              <option value="">Kim ödedi?</option>
              {participants.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {participant.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="TL"
              value={form.amount}
              onChange={(e) => setForm((state) => ({ ...state, amount: e.target.value }))}
              min="1"
              className="w-28 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition"
            />
          </div>
        ) : (
          <div className="space-y-2">
            {form.payers.map((payer) => (
              <div key={payer.id} className="flex gap-2 items-center">
                <select
                  value={payer.participantId}
                  onChange={(e) => updatePayer(payer.id, 'participantId', e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition"
                >
                  <option value="">Kişi seç</option>
                  {participants.map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      {participant.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="TL"
                  value={payer.amount}
                  onChange={(e) => updatePayer(payer.id, 'amount', e.target.value)}
                  min="1"
                  className="w-24 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition"
                />
                {form.payers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePayerRow(payer.id)}
                    className="text-gray-600 hover:text-red-400 transition text-lg leading-none px-1"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addPayerRow}
              className="w-full py-2 border border-dashed border-gray-700 hover:border-orange-500 text-gray-500 hover:text-orange-400 rounded-xl text-xs transition"
            >
              + Kişi Ekle
            </button>
          </div>
        )}

        {participants.length === 0 && <p className="text-xs text-yellow-500">Önce katılımcı ekleyin</p>}

        <button
          type="submit"
          disabled={participants.length === 0}
          className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-gray-700 disabled:text-gray-500 text-white py-3 rounded-xl font-semibold text-sm transition"
        >
          Harcama Ekle
        </button>
      </form>

      {expenses.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <div className="text-4xl mb-3">🧾</div>
          <p className="text-sm">Henüz harcama eklenmedi</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {expenses.map((expense) => {
            const payer = participants.find((participant) => participant.id === expense.paidBy);
            return (
              <li key={expense.id} className="flex items-center justify-between bg-gray-900 rounded-xl px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{expense.desc}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{payer?.name ?? 'Bilinmiyor'} ödedi</p>
                </div>
                <div className="flex items-center gap-3 ml-3">
                  <span className="font-bold text-orange-400">{expense.amount} TL</span>
                  <button
                    onClick={() => removeExpense(expense.id)}
                    className="text-gray-600 hover:text-red-400 transition text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
              </li>
            );
          })}
          <div className="flex justify-between text-sm text-gray-400 px-1 pt-1 border-t border-gray-800">
            <span>Toplam</span>
            <span className="font-bold text-white">{result.totalExpense} TL</span>
          </div>
        </ul>
      )}
    </div>
  );
}
