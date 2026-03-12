import { useState, useEffect, useRef } from 'react';
import { calculateSplits } from './utils/calculator';
import { parseWhatsAppChat } from './utils/whatsappParser';

const STORAGE_KEY = 'mangal-data';
const ARCHIVE_KEY = 'mangal-archives';

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { participants: [], expenses: [] };
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadArchives() {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveArchives(archives) {
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archives));
}

const SHOPPING_ITEMS = [
  { key: 'et',       label: 'Et (köfte/biftek)',  unit: 'g',   perPerson: 250 },
  { key: 'ekmek',    label: 'Ekmek',               unit: 'adet', perPerson: 1   },
  { key: 'icelik',   label: 'İçecek (0.5L)',       unit: 'şişe', perPerson: 1   },
  { key: 'komur',    label: 'Kömür',               unit: 'kg',  perPerson: 0.4 },
  { key: 'peynir',   label: 'Hellim/Peynir',       unit: 'g',   perPerson: 80  },
  { key: 'domates',  label: 'Domates/Biber',       unit: 'adet', perPerson: 2   },
  { key: 'tabak',    label: 'Kağıt tabak/peçete',  unit: 'takım', perPerson: 1  },
];

const CHART_COLORS = ['#f97316','#3b82f6','#22c55e','#a855f7','#ec4899','#eab308','#14b8a6','#ef4444'];

function DonutChart({ balances }) {
  const total = balances.reduce((s, b) => s + b.totalPaid, 0);
  if (total === 0) return null;
  const cx = 90, cy = 90, r = 62, sw = 26;
  const circ = 2 * Math.PI * r;
  const sorted = [...balances].sort((a, b) => b.totalPaid - a.totalPaid);
  const king = sorted[0];
  let offset = 0;
  const slices = sorted.map((b, i) => {
    const frac = b.totalPaid / total;
    const s = { ...b, frac, offset, color: CHART_COLORS[i % CHART_COLORS.length] };
    offset += frac;
    return s;
  });
  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Mangalın Ağası</h3>
      <div className="flex items-center gap-6">
        <svg width="180" height="180" viewBox="0 0 180 180" className="flex-shrink-0">
          {slices.map((s, i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={s.color} strokeWidth={sw}
              strokeDasharray={`${circ * s.frac} ${circ}`}
              strokeDashoffset={-circ * s.offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          ))}
          <text x={cx} y={cy - 10} textAnchor="middle" fontSize="12" fill="#9ca3af">{king.name}</text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#f97316">{king.totalPaid} TL</text>
          <text x={cx} y={cy + 28} textAnchor="middle" fontSize="10" fill="#6b7280">
            %{Math.round((king.totalPaid / total) * 100)}
          </text>
        </svg>
        <ul className="space-y-2 flex-1">
          {slices.map((s, i) => (
            <li key={i} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-sm truncate">{s.name}</span>
                {i === 0 && <span className="text-xs">👑</span>}
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">{s.totalPaid} TL</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(loadData);
  const [tab, setTab] = useState('participants');
  const [newName, setNewName] = useState('');
  const [form, setForm] = useState({ desc: '', paidBy: '', amount: '', multiPayer: false, payers: [{ id: '1', participantId: '', amount: '' }] });
  const [copied, setCopied] = useState(false);
  const [archives, setArchives] = useState(loadArchives);
  const [expandedArchive, setExpandedArchive] = useState(null);
  const [meatPerPerson, setMeatPerPerson] = useState(250);
  const [showShopping, setShowShopping] = useState(false);
  const [shoppingList, setShoppingList] = useState({});
  const [importModal, setImportModal] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [detected, setDetected] = useState([]);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef();

  useEffect(() => saveData(data), [data]);
  useEffect(() => saveArchives(archives), [archives]);

  const { participants, expenses } = data;

  function addParticipant(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setData((d) => ({
      ...d,
      participants: [...d.participants, { id: crypto.randomUUID(), name }],
    }));
    setNewName('');
  }

  function removeParticipant(id) {
    setData((d) => ({
      ...d,
      participants: d.participants.filter((p) => p.id !== id),
      expenses: d.expenses.filter((e) => e.paidBy !== id),
    }));
  }

  function addExpense(e) {
    e.preventDefault();
    const desc = form.desc.trim();
    if (!desc) return;
    if (form.multiPayer) {
      const valid = form.payers.filter((p) => p.participantId && parseFloat(p.amount) > 0);
      if (valid.length === 0) return;
      setData((d) => ({
        ...d,
        expenses: [
          ...d.expenses,
          ...valid.map((p) => ({ id: crypto.randomUUID(), desc, paidBy: p.participantId, amount: Math.round(parseFloat(p.amount)) })),
        ],
      }));
      setForm((f) => ({ ...f, desc: '', payers: [{ id: crypto.randomUUID(), participantId: '', amount: '' }] }));
    } else {
      const amount = Math.round(parseFloat(form.amount));
      if (!form.paidBy || !amount || amount <= 0) return;
      setData((d) => ({
        ...d,
        expenses: [...d.expenses, { id: crypto.randomUUID(), desc, paidBy: form.paidBy, amount }],
      }));
      setForm((f) => ({ ...f, desc: '', paidBy: '', amount: '' }));
    }
  }

  function addPayerRow() {
    setForm((f) => ({ ...f, payers: [...f.payers, { id: crypto.randomUUID(), participantId: '', amount: '' }] }));
  }
  function removePayerRow(id) {
    setForm((f) => ({ ...f, payers: f.payers.filter((p) => p.id !== id) }));
  }
  function updatePayer(id, field, value) {
    setForm((f) => ({ ...f, payers: f.payers.map((p) => p.id === id ? { ...p, [field]: value } : p) }));
  }

  function removeExpense(id) {
    setData((d) => ({ ...d, expenses: d.expenses.filter((e) => e.id !== id) }));
  }

  function resetAll() {
    if (confirm('Tüm veriler silinecek. Emin misin?')) {
      setData({ participants: [], expenses: [] });
    }
  }

  function archiveMangal() {
    if (participants.length === 0 && expenses.length === 0) return;
    const name = prompt('Bu mangala bir isim ver:', `Mangal ${new Date().toLocaleDateString('tr-TR')}`);
    if (!name) return;
    const { totalExpense, perPerson } = calculateSplits(participants, expenses);
    const entry = {
      id: crypto.randomUUID(),
      name: name.trim(),
      date: new Date().toLocaleDateString('tr-TR'),
      participants: [...participants],
      expenses: [...expenses],
      totalExpense,
      perPerson,
    };
    setArchives((a) => [entry, ...a]);
    setData({ participants: [], expenses: [] });
    setTab('archive');
  }

  const result = calculateSplits(participants, expenses);

  function copyDebts() {
    const { transactions, totalExpense, perPerson } = result;
    if (transactions.length === 0) return;
    const lines = [
      'Mangal Hesabı',
      `Toplam: ${totalExpense} TL | Kişi başı: ${perPerson} TL`,
      '',
      'Yapılacak Ödemeler:',
      ...transactions.map((t) => `• ${t.from} → ${t.to}: ${t.amount} TL`),
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleFile(file) {
    setImportError('');
    if (!file || !file.name.endsWith('.txt')) {
      setImportError('Sadece .txt dosyası kabul edilir.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const found = parseWhatsAppChat(e.target.result);
      if (found.length === 0) {
        setImportError('Harcama içeren mesaj bulunamadı.');
      } else {
        setDetected(found);
      }
    };
    reader.readAsText(file, 'utf-8');
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function toggleDetected(id) {
    setDetected((d) => d.map((item) => item.id === id ? { ...item, selected: !item.selected } : item));
  }

  function confirmImport() {
    const selected = detected.filter((d) => d.selected);
    if (selected.length === 0) return;

    setData((prev) => {
      let newParticipants = [...prev.participants];
      let newExpenses = [...prev.expenses];

      for (const item of selected) {
        let p = newParticipants.find((p) => p.name.toLowerCase() === item.name.toLowerCase());
        if (!p) {
          p = { id: crypto.randomUUID(), name: item.name };
          newParticipants.push(p);
        }
        newExpenses.push({
          id: crypto.randomUUID(),
          desc: item.message.slice(0, 60),
          paidBy: p.id,
          amount: item.amount,
        });
      }

      return { participants: newParticipants, expenses: newExpenses };
    });

    setImportModal(false);
    setDetected([]);
    setImportError('');
    setTab('expenses');
  }

  function closeModal() {
    setImportModal(false);
    setDetected([]);
    setImportError('');
  }

  const tabs = [
    { id: 'participants', label: 'Katılımcılar' },
    { id: 'expenses', label: 'Harcamalar' },
    { id: 'result', label: 'Sonuç' },
    { id: 'archive', label: 'Arşiv' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold text-orange-400 mb-1">Mangal Hesabı</h1>
          <p className="text-gray-400 text-sm">Kim ne ödedi, kim ne borçlanıyor?</p>
          <button
            onClick={() => setImportModal(true)}
            className="mt-3 inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.528 5.845L.057 23.547a.75.75 0 00.92.92l5.701-1.471A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.725 9.725 0 01-4.964-1.359l-.357-.212-3.703.955.975-3.608-.232-.371A9.722 9.722 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
            </svg>
            WhatsApp'tan Aktar
          </button>
        </div>

        {/* Özet Bar */}
        {expenses.length > 0 && participants.length > 0 && (
          <div className="flex gap-3 mb-6">
            <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-gray-500">Toplam Harcama</span>
              <span className="font-bold text-white">{result.totalExpense} TL</span>
            </div>
            <div className="flex-1 bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-orange-300/70">Kişi Başı</span>
              <span className="font-bold text-orange-400">{result.perPerson} TL</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-gray-900 rounded-xl p-1 mb-6 gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-orange-500 text-white shadow'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {t.label}
              {t.id === 'participants' && participants.length > 0 && (
                <span className="ml-1 text-xs opacity-75">({participants.length})</span>
              )}
              {t.id === 'expenses' && expenses.length > 0 && (
                <span className="ml-1 text-xs opacity-75">({expenses.length})</span>
              )}
              {t.id === 'archive' && archives.length > 0 && (
                <span className="ml-1 text-xs opacity-75">({archives.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Katilimcilar */}
        {tab === 'participants' && (
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
                {participants.map((p) => (
                  <li key={p.id} className="flex items-center justify-between bg-gray-900 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-sm font-bold">
                        {p.name[0].toUpperCase()}
                      </div>
                      <span className="font-medium">{p.name}</span>
                    </div>
                    <button onClick={() => removeParticipant(p.id)} className="text-gray-600 hover:text-red-400 transition text-lg leading-none">×</button>
                  </li>
                ))}
              </ul>
            )}

            {/* Alışveriş Listesi */}
            {participants.length > 0 && (
              <div className="bg-gray-900 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowShopping((s) => !s)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-300 hover:text-white transition"
                >
                  <span>Alışveriş Listesi</span>
                  <span className="text-gray-500">{showShopping ? '▲' : '▼'}</span>
                </button>
                {showShopping && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-800 pt-3">
                    {/* Et slider */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-24 flex-shrink-0">Et / kişi</span>
                      <input
                        type="range" min="150" max="500" step="50"
                        value={meatPerPerson}
                        onChange={(e) => setMeatPerPerson(Number(e.target.value))}
                        className="flex-1 accent-orange-500"
                      />
                      <span className="text-xs text-orange-400 w-12 text-right">{meatPerPerson}g</span>
                    </div>

                    {/* Editable list */}
                    <ul className="space-y-2">
                      {SHOPPING_ITEMS.map((item) => {
                        const defaultQty = item.key === 'et'
                          ? Math.ceil((participants.length * meatPerPerson) / 100) * 100
                          : item.unit === 'kg'
                          ? parseFloat((participants.length * item.perPerson).toFixed(1))
                          : Math.ceil(participants.length * item.perPerson);
                        const val = shoppingList[item.key] ?? defaultQty;
                        return (
                          <li key={item.key} className="flex items-center gap-2">
                            <span className="text-gray-300 text-sm flex-1">{item.label}</span>
                            <input
                              type="number"
                              min="0"
                              step={item.unit === 'kg' ? '0.5' : item.unit === 'g' ? '50' : '1'}
                              value={val}
                              onChange={(e) => setShoppingList((s) => ({ ...s, [item.key]: e.target.value }))}
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
        )}

        {/* Harcamalar */}
        {tab === 'expenses' && (
          <div className="space-y-4">
            <form onSubmit={addExpense} className="bg-gray-900 rounded-xl p-4 space-y-3">
              <input
                type="text"
                placeholder="Açıklama (et, içecek, kömür...)"
                value={form.desc}
                onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition"
              />
              {/* Ödeme modu toggle */}
              <div className="flex bg-gray-800 rounded-xl p-1 gap-1">
                <button type="button" onClick={() => setForm((f) => ({ ...f, multiPayer: false }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${!form.multiPayer ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
                  Tek Kişi Ödedi
                </button>
                <button type="button" onClick={() => setForm((f) => ({ ...f, multiPayer: true }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${form.multiPayer ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
                  Birden Fazla Ödedi
                </button>
              </div>

              {!form.multiPayer ? (
                <div className="flex gap-2">
                  <select value={form.paidBy} onChange={(e) => setForm((f) => ({ ...f, paidBy: e.target.value }))}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition">
                    <option value="">Kim ödedi?</option>
                    {participants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input type="number" placeholder="TL" value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} min="1"
                    className="w-28 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition" />
                </div>
              ) : (
                <div className="space-y-2">
                  {form.payers.map((payer, i) => (
                    <div key={payer.id} className="flex gap-2 items-center">
                      <select value={payer.participantId} onChange={(e) => updatePayer(payer.id, 'participantId', e.target.value)}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition">
                        <option value="">Kişi seç</option>
                        {participants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input type="number" placeholder="TL" value={payer.amount}
                        onChange={(e) => updatePayer(payer.id, 'amount', e.target.value)} min="1"
                        className="w-24 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition" />
                      {form.payers.length > 1 && (
                        <button type="button" onClick={() => removePayerRow(payer.id)}
                          className="text-gray-600 hover:text-red-400 transition text-lg leading-none px-1">×</button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addPayerRow}
                    className="w-full py-2 border border-dashed border-gray-700 hover:border-orange-500 text-gray-500 hover:text-orange-400 rounded-xl text-xs transition">
                    + Kişi Ekle
                  </button>
                </div>
              )}
              {participants.length === 0 && (
                <p className="text-xs text-yellow-500">Önce katılımcı ekleyin</p>
              )}
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
                {expenses.map((e) => {
                  const payer = participants.find((p) => p.id === e.paidBy);
                  return (
                    <li key={e.id} className="flex items-center justify-between bg-gray-900 rounded-xl px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{e.desc}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{payer?.name ?? 'Bilinmiyor'} ödedi</p>
                      </div>
                      <div className="flex items-center gap-3 ml-3">
                        <span className="font-bold text-orange-400">{e.amount} TL</span>
                        <button onClick={() => removeExpense(e.id)} className="text-gray-600 hover:text-red-400 transition text-lg leading-none">×</button>
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
        )}

        {/* Sonuc */}
        {tab === 'result' && (
          <div className="space-y-4">
            {participants.length === 0 || expenses.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <div className="text-4xl mb-3">🔥</div>
                <p className="text-sm">Katılımcı ve harcama ekleyin</p>
              </div>
            ) : (
              <>
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
                  {result.balances.map((b) => (
                    <div key={b.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold">
                          {b.name[0].toUpperCase()}
                        </div>
                        <span className="text-sm">{b.name}</span>
                        <span className="text-xs text-gray-600">({b.totalPaid} TL ödedi)</span>
                      </div>
                      <span className={`text-sm font-bold ${b.balance > 0 ? 'text-green-400' : b.balance < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                        {b.balance > 0 ? '+' : ''}{b.balance} TL
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
                      <button onClick={copyDebts} className="text-xs px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition">
                        {copied ? 'Kopyalandı!' : 'Kopyala'}
                      </button>
                    </div>
                    {result.transactions.map((t, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2.5">
                        <div className="text-sm">
                          <span className="text-red-400 font-medium">{t.from}</span>
                          <span className="text-gray-500 mx-2">→</span>
                          <span className="text-green-400 font-medium">{t.to}</span>
                        </div>
                        <span className="font-bold text-orange-400 text-sm">{t.amount} TL</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Arşiv Tab */}
        {tab === 'archive' && (
          <div className="space-y-3">
            {archives.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <div className="text-4xl mb-3">📦</div>
                <p className="text-sm">Henüz arşivlenmiş mangal yok</p>
                <p className="text-xs mt-1 text-gray-700">Mevcut mangalı kaydetmek için aşağıdaki butonu kullan</p>
              </div>
            ) : (
              archives.map((a) => (
                <div key={a.id} className="bg-gray-900 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedArchive(expandedArchive === a.id ? null : a.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-800 transition"
                  >
                    <div>
                      <p className="font-medium text-sm">{a.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{a.date} · {a.participants.length} kişi</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-orange-400 font-bold text-sm">{a.totalExpense} TL</span>
                      <span className="text-gray-600 text-xs">{expandedArchive === a.id ? '▲' : '▼'}</span>
                    </div>
                  </button>
                  {expandedArchive === a.id && (
                    <div className="border-t border-gray-800 px-4 py-3 space-y-2">
                      <div className="flex justify-between text-xs text-gray-500 pb-1">
                        <span>Kişi başı: <span className="text-orange-400 font-semibold">{a.perPerson} TL</span></span>
                        <span>{a.participants.map((p) => p.name).join(', ')}</span>
                      </div>
                      {a.expenses.map((e) => {
                        const payer = a.participants.find((p) => p.id === e.paidBy);
                        return (
                          <div key={e.id} className="flex justify-between text-sm">
                            <span className="text-gray-400 truncate flex-1">{e.desc}</span>
                            <span className="text-gray-500 text-xs ml-2">{payer?.name}</span>
                            <span className="text-orange-400 font-semibold ml-3">{e.amount} TL</span>
                          </div>
                        );
                      })}
                      <button
                        onClick={() => { if (confirm(`"${a.name}" silinsin mi?`)) setArchives((arr) => arr.filter((x) => x.id !== a.id)); }}
                        className="text-xs text-red-700 hover:text-red-500 transition mt-1"
                      >
                        Arşivden sil
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Kaydet / Sıfırla */}
        {(participants.length > 0 || expenses.length > 0) && (
          <div className="flex gap-3 mt-6">
            <button onClick={archiveMangal} className="flex-1 py-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 text-sm font-medium transition">
              Kaydet ve Bitir
            </button>
            <button onClick={resetAll} className="flex-1 py-3 rounded-xl border border-red-900/50 text-red-500 hover:bg-red-900/20 text-sm font-medium transition">
              Sıfırla
            </button>
          </div>
        )}
      </div>

      {/* WhatsApp Import Modal */}
      {importModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="bg-gray-900 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="font-bold text-lg">WhatsApp'tan Aktar</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-white text-2xl leading-none">×</button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {detected.length === 0 ? (
                <>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-10 text-center transition cursor-pointer ${dragOver ? 'border-green-400 bg-green-900/20' : 'border-gray-700 hover:border-gray-500'}`}
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
                  {importError && (
                    <p className="text-red-400 text-sm text-center">{importError}</p>
                  )}
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
                        className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition border ${item.selected ? 'border-orange-500/50 bg-orange-500/5' : 'border-gray-800 bg-gray-800/50'}`}
                      >
                        <div className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition ${item.selected ? 'bg-orange-500 border-orange-500' : 'border-gray-600'}`}>
                          {item.selected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
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
                <button onClick={() => { setDetected([]); setImportError(''); }} className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white text-sm transition">
                  Geri
                </button>
                <button
                  onClick={confirmImport}
                  disabled={detected.filter(d => d.selected).length === 0}
                  className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold text-sm transition"
                >
                  {detected.filter(d => d.selected).length} Harcamayı Ekle
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
