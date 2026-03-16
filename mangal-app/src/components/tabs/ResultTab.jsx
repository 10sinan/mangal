import DonutChart from '../DonutChart';

export default function ResultTab({ participants, expenses, result, copied, copyDebts }) {
  if (participants.length === 0 || expenses.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600">
        <div className="text-4xl mb-3">🔥</div>
        <p className="text-sm">Katılımcı ve harcama ekleyin</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Toplam</p>
          <p className="text-xl font-bold text-white">{result.totalExpense}</p>
          <p className="text-xs text-gray-500">TL</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Kişi Başı</p>
          <p className="text-xl font-bold text-orange-400">{result.perPerson}</p>
          <p className="text-xs text-gray-500">TL</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Kisi</p>
          <p className="text-xl font-bold text-white">{participants.length}</p>
          <p className="text-xs text-gray-500">kişi</p>
        </div>
      </div>

      <DonutChart balances={result.balances} />

      <div className="bg-gray-900 rounded-xl p-4 space-y-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Bakiyeler</h3>
        {result.balances.map((balance) => (
          <div key={balance.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold">
                {balance.name[0].toUpperCase()}
              </div>
              <span className="text-sm">{balance.name}</span>
              <span className="text-xs text-gray-600">({balance.totalPaid} TL ödedi)</span>
            </div>
            <span
              className={`text-sm font-bold ${
                balance.balance > 0 ? 'text-green-400' : balance.balance < 0 ? 'text-red-400' : 'text-gray-500'
              }`}
            >
              {balance.balance > 0 ? '+' : ''}
              {balance.balance} TL
            </span>
          </div>
        ))}
      </div>

      {result.transactions.length === 0 ? (
        <div className="bg-green-900/30 border border-green-700/50 rounded-xl p-4 text-center">
          <p className="text-green-400 font-semibold text-sm">Hesaplar kapalı!</p>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Yapılacak Ödemeler</h3>
            <button
              onClick={copyDebts}
              className="text-xs px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition"
            >
              {copied ? 'Kopyalandı!' : 'Kopyala'}
            </button>
          </div>
          {result.transactions.map((transaction, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2.5">
              <div className="text-sm">
                <span className="text-red-400 font-medium">{transaction.from}</span>
                <span className="text-gray-500 mx-2">→</span>
                <span className="text-green-400 font-medium">{transaction.to}</span>
              </div>
              <span className="font-bold text-orange-400 text-sm">{transaction.amount} TL</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
