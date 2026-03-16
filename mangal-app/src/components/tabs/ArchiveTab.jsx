export default function ArchiveTab({ archives, expandedArchive, setExpandedArchive, deleteArchive }) {
  if (archives.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600">
        <div className="text-4xl mb-3">📦</div>
        <p className="text-sm">Henüz arşivlenmiş mangal yok</p>
        <p className="text-xs mt-1 text-gray-700">Mevcut mangalı kaydetmek için aşağıdaki butonu kullan</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {archives.map((archive) => (
        <div key={archive.id} className="bg-gray-900 rounded-xl overflow-hidden">
          <button
            onClick={() => setExpandedArchive(expandedArchive === archive.id ? null : archive.id)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-800 transition"
          >
            <div>
              <p className="font-medium text-sm">{archive.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {archive.date} · {archive.participants.length} kişi
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-orange-400 font-bold text-sm">{archive.totalExpense} TL</span>
              <span className="text-gray-600 text-xs">{expandedArchive === archive.id ? '▲' : '▼'}</span>
            </div>
          </button>

          {expandedArchive === archive.id && (
            <div className="border-t border-gray-800 px-4 py-3 space-y-2">
              <div className="flex justify-between text-xs text-gray-500 pb-1">
                <span>
                  Kişi başı: <span className="text-orange-400 font-semibold">{archive.perPerson} TL</span>
                </span>
                <span>{archive.participants.map((participant) => participant.name).join(', ')}</span>
              </div>

              {archive.expenses.map((expense) => {
                const payer = archive.participants.find((participant) => participant.id === expense.paidBy);
                return (
                  <div key={expense.id} className="flex justify-between text-sm">
                    <span className="text-gray-400 truncate flex-1">{expense.desc}</span>
                    <span className="text-gray-500 text-xs ml-2">{payer?.name}</span>
                    <span className="text-orange-400 font-semibold ml-3">{expense.amount} TL</span>
                  </div>
                );
              })}

              <button
                onClick={() => {
                  if (confirm(`"${archive.name}" silinsin mi?`)) {
                    deleteArchive(archive.id);
                  }
                }}
                className="text-xs text-red-700 hover:text-red-500 transition mt-1"
              >
                Arşivden sil
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
