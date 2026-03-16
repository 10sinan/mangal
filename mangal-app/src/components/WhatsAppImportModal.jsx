import { useRef } from 'react';

export default function WhatsAppImportModal({
  isOpen,
  closeModal,
  detected,
  importError,
  dragOver,
  setDragOver,
  setDetected,
  setImportError,
  toggleDetected,
  confirmImport,
  handleFile,
}) {
  const fileInputRef = useRef();

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }

  if (!isOpen) return null;

  const selectedCount = detected.filter((item) => item.selected).length;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
      onClick={(e) => e.target === e.currentTarget && closeModal()}
    >
      <div className="bg-gray-900 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="font-bold text-lg">WhatsApp'tan Aktar</h2>
          <button onClick={closeModal} className="text-gray-500 hover:text-white text-2xl leading-none">
            ×
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {detected.length === 0 ? (
            <>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-10 text-center transition cursor-pointer ${
                  dragOver ? 'border-green-400 bg-green-900/20' : 'border-gray-700 hover:border-gray-500'
                }`}
                onClick={() => fileInputRef.current.click()}
              >
                <div className="text-4xl mb-3">📂</div>
                <p className="text-sm text-gray-300 font-medium">Dosyayı buraya sürükle</p>
                <p className="text-xs text-gray-600 mt-1">veya tıkla ve seç</p>
                <p className="text-xs text-gray-700 mt-3">Sadece .txt dosyası</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </div>
              {importError && <p className="text-red-400 text-sm text-center">{importError}</p>}
              <div className="bg-gray-800 rounded-xl p-4 text-xs text-gray-500 space-y-1">
                <p className="font-medium text-gray-400 mb-2">Nasıl export edilir?</p>
                <p>WhatsApp → Grup → Sağ üst ⋮ → Daha fazla → Sohbeti dışa aktar → Medya olmadan</p>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-400">{detected.length} harcama bulundu. Eklemek istediklerini seç:</p>
              <ul className="space-y-2">
                {detected.map((item) => (
                  <li
                    key={item.id}
                    onClick={() => toggleDetected(item.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition border ${
                      item.selected ? 'border-orange-500/50 bg-orange-500/5' : 'border-gray-800 bg-gray-800/50'
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition ${
                        item.selected ? 'bg-orange-500 border-orange-500' : 'border-gray-600'
                      }`}
                    >
                      {item.selected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm">{item.name}</span>
                        <span className="font-bold text-orange-400 text-sm flex-shrink-0">{item.amount} TL</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{item.message}</p>
                      <p className="text-xs text-gray-700 mt-0.5">{item.date}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {detected.length > 0 && (
          <div className="p-5 border-t border-gray-800 flex gap-3">
            <button
              onClick={() => {
                setDetected([]);
                setImportError('');
              }}
              className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white text-sm transition"
            >
              Geri
            </button>
            <button
              onClick={confirmImport}
              disabled={selectedCount === 0}
              className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold text-sm transition"
            >
              {selectedCount} Harcamayı Ekle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
