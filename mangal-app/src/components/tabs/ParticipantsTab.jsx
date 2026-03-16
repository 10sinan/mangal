export default function ParticipantsTab({
  participants,
  newName,
  setNewName,
  addParticipant,
  removeParticipant,
  showShopping,
  setShowShopping,
  meatPerPerson,
  setMeatPerPerson,
  shoppingList,
  setShoppingList,
  shoppingItems,
}) {
  return (
    <div className="space-y-4">
      <form onSubmit={addParticipant} className="flex gap-2">
        <input
          type="text"
          placeholder="Katılımcı adı..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition"
        />
        <button
          type="submit"
          className="bg-orange-500 hover:bg-orange-400 text-white px-5 py-3 rounded-xl font-semibold text-sm transition"
        >
          Ekle
        </button>
      </form>

      {participants.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <div className="text-4xl mb-3">👤</div>
          <p className="text-sm">Henüz katılımcı eklenmedi</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {participants.map((participant) => (
            <li key={participant.id} className="flex items-center justify-between bg-gray-900 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-sm font-bold">
                  {participant.name[0].toUpperCase()}
                </div>
                <span className="font-medium">{participant.name}</span>
              </div>
              <button
                onClick={() => removeParticipant(participant.id)}
                className="text-gray-600 hover:text-red-400 transition text-lg leading-none"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {participants.length > 0 && (
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowShopping((show) => !show)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-300 hover:text-white transition"
          >
            <span>Alışveriş Listesi</span>
            <span className="text-gray-500">{showShopping ? '▲' : '▼'}</span>
          </button>

          {showShopping && (
            <div className="px-4 pb-4 space-y-3 border-t border-gray-800 pt-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-24 flex-shrink-0">Et / kişi</span>
                <input
                  type="range"
                  min="150"
                  max="500"
                  step="50"
                  value={meatPerPerson}
                  onChange={(e) => setMeatPerPerson(Number(e.target.value))}
                  className="flex-1 accent-orange-500"
                />
                <span className="text-xs text-orange-400 w-12 text-right">{meatPerPerson}g</span>
              </div>

              <ul className="space-y-2">
                {shoppingItems.map((item) => {
                  const defaultQty =
                    item.key === 'et'
                      ? Math.ceil((participants.length * meatPerPerson) / 100) * 100
                      : item.unit === 'kg'
                        ? parseFloat((participants.length * item.perPerson).toFixed(1))
                        : Math.ceil(participants.length * item.perPerson);

                  const value = shoppingList[item.key] ?? defaultQty;

                  return (
                    <li key={item.key} className="flex items-center gap-2">
                      <span className="text-gray-300 text-sm flex-1">{item.label}</span>
                      <input
                        type="number"
                        min="0"
                        step={item.unit === 'kg' ? '0.5' : item.unit === 'g' ? '50' : '1'}
                        value={value}
                        onChange={(e) => setShoppingList((state) => ({ ...state, [item.key]: e.target.value }))}
                        className="w-20 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-orange-400 font-semibold text-right focus:outline-none focus:border-orange-500 transition"
                      />
                      <span className="text-xs text-gray-600 w-8">{item.unit}</span>
                    </li>
                  );
                })}
              </ul>

              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-gray-700">{participants.length} kişi için</p>
                <button
                  type="button"
                  onClick={() => setShoppingList({})}
                  className="text-xs text-gray-600 hover:text-orange-400 transition"
                >
                  Yeniden Hesapla
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
