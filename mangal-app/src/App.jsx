import { useState } from 'react';
import { calculateSplits } from './utils/calculator';
import { parseWhatsAppChat } from './utils/whatsappParser';
import { useMangalStore } from './store/useMangalStore';
import ParticipantsTab from './components/tabs/ParticipantsTab';
import ExpensesTab from './components/tabs/ExpensesTab';
import ResultTab from './components/tabs/ResultTab';
import ArchiveTab from './components/tabs/ArchiveTab';
import WhatsAppImportModal from './components/WhatsAppImportModal';

function parseAmountInput(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim().replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round((parsed + Number.EPSILON) * 100) / 100;
}

const SHOPPING_ITEMS = [
  { key: 'et', label: 'Et (köfte/biftek)', unit: 'g', perPerson: 250 },
  { key: 'ekmek', label: 'Ekmek', unit: 'adet', perPerson: 1 },
  { key: 'icelik', label: 'İçecek (0.5L)', unit: 'şişe', perPerson: 1 },
  { key: 'komur', label: 'Kömür', unit: 'kg', perPerson: 0.4 },
  { key: 'peynir', label: 'Hellim/Peynir', unit: 'g', perPerson: 80 },
  { key: 'domates', label: 'Domates/Biber', unit: 'adet', perPerson: 2 },
  { key: 'tabak', label: 'Kağıt tabak/peçete', unit: 'takım', perPerson: 1 },
];

export default function App() {
  const {
    participants,
    expenses,
    archives,
    tab,
    setTab,
    addParticipant: addParticipantToStore,
    removeParticipant: removeParticipantFromStore,
    addExpenses: addExpensesToStore,
    removeExpense: removeExpenseFromStore,
    replaceData,
    resetData,
    addArchive,
    deleteArchive,
  } = useMangalStore();

  const [newName, setNewName] = useState('');
  const [form, setForm] = useState({
    desc: '',
    paidBy: '',
    amount: '',
    multiPayer: false,
    payers: [{ id: '1', participantId: '', amount: '' }],
  });
  const [copied, setCopied] = useState(false);
  const [expandedArchive, setExpandedArchive] = useState(null);
  const [meatPerPerson, setMeatPerPerson] = useState(250);
  const [showShopping, setShowShopping] = useState(false);
  const [shoppingList, setShoppingList] = useState({});
  const [importModal, setImportModal] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [detected, setDetected] = useState([]);
  const [importError, setImportError] = useState('');

  const result = calculateSplits(participants, expenses);

  function addParticipant(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const added = addParticipantToStore(name);
    if (added) setNewName('');
  }

  function removeParticipant(id) {
    removeParticipantFromStore(id);
  }

  function addExpense(e) {
    e.preventDefault();
    const desc = form.desc.trim();
    if (!desc) return;

    if (form.multiPayer) {
      const valid = form.payers
        .map((payer) => ({ ...payer, parsedAmount: parseAmountInput(payer.amount) }))
        .filter((payer) => payer.participantId && payer.parsedAmount);

      if (valid.length === 0) return;

      addExpensesToStore(
        valid.map((payer) => ({
          id: crypto.randomUUID(),
          desc,
          paidBy: payer.participantId,
          amount: payer.parsedAmount,
        })),
      );
      setForm((state) => ({
        ...state,
        desc: '',
        payers: [{ id: crypto.randomUUID(), participantId: '', amount: '' }],
      }));
      return;
    }

    const amount = parseAmountInput(form.amount);
    if (!form.paidBy || !amount || amount <= 0) return;

    addExpensesToStore([{ id: crypto.randomUUID(), desc, paidBy: form.paidBy, amount }]);
    setForm((state) => ({ ...state, desc: '', paidBy: '', amount: '' }));
  }

  function addPayerRow() {
    setForm((state) => ({
      ...state,
      payers: [...state.payers, { id: crypto.randomUUID(), participantId: '', amount: '' }],
    }));
  }

  function removePayerRow(id) {
    setForm((state) => ({ ...state, payers: state.payers.filter((payer) => payer.id !== id) }));
  }

  function updatePayer(id, field, value) {
    setForm((state) => ({
      ...state,
      payers: state.payers.map((payer) => (payer.id === id ? { ...payer, [field]: value } : payer)),
    }));
  }

  function removeExpense(id) {
    removeExpenseFromStore(id);
  }

  function resetAll() {
    if (confirm('Tüm veriler silinecek. Emin misin?')) {
      resetData();
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

    addArchive(entry);
    resetData();
    setTab('archive');
  }

  function copyDebts() {
    const { transactions, totalExpense, perPerson } = result;
    if (transactions.length === 0) return;

    const lines = [
      'Mangal Hesabı',
      `Toplam: ${totalExpense} TL | Kişi başı: ${perPerson} TL`,
      '',
      'Yapılacak Ödemeler:',
      ...transactions.map((transaction) => `• ${transaction.from} → ${transaction.to}: ${transaction.amount} TL`),
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

  function toggleDetected(id) {
    setDetected((state) => state.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item)));
  }

  function confirmImport() {
    const selected = detected.filter((item) => item.selected);
    if (selected.length === 0) return;

    const newParticipants = [...participants];
    const newExpenses = [...expenses];

    for (const item of selected) {
      let participant = newParticipants.find((existing) => existing.name.toLowerCase() === item.name.toLowerCase());
      if (!participant) {
        participant = { id: crypto.randomUUID(), name: item.name };
        newParticipants.push(participant);
      }
      newExpenses.push({
        id: crypto.randomUUID(),
        desc: item.message.slice(0, 60),
        paidBy: participant.id,
        amount: item.amount,
      });
    }

    replaceData({ participants: newParticipants, expenses: newExpenses });
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
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold text-orange-400 mb-1">Mangal Hesabı</h1>
          <p className="text-gray-400 text-sm">Kim ne ödedi, kim ne borçlanıyor?</p>
          <button
            onClick={() => setImportModal(true)}
            className="mt-3 inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.528 5.845L.057 23.547a.75.75 0 00.92.92l5.701-1.471A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.725 9.725 0 01-4.964-1.359l-.357-.212-3.703.955.975-3.608-.232-.371A9.722 9.722 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
            </svg>
            WhatsApp'tan Aktar
          </button>
        </div>

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

        <div className="flex bg-gray-900 rounded-xl p-1 mb-6 gap-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === item.id ? 'bg-orange-500 text-white shadow' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {item.label}
              {item.id === 'participants' && participants.length > 0 && (
                <span className="ml-1 text-xs opacity-75">({participants.length})</span>
              )}
              {item.id === 'expenses' && expenses.length > 0 && (
                <span className="ml-1 text-xs opacity-75">({expenses.length})</span>
              )}
              {item.id === 'archive' && archives.length > 0 && (
                <span className="ml-1 text-xs opacity-75">({archives.length})</span>
              )}
            </button>
          ))}
        </div>

        {tab === 'participants' && (
          <ParticipantsTab
            participants={participants}
            newName={newName}
            setNewName={setNewName}
            addParticipant={addParticipant}
            removeParticipant={removeParticipant}
            showShopping={showShopping}
            setShowShopping={setShowShopping}
            meatPerPerson={meatPerPerson}
            setMeatPerPerson={setMeatPerPerson}
            shoppingList={shoppingList}
            setShoppingList={setShoppingList}
            shoppingItems={SHOPPING_ITEMS}
          />
        )}

        {tab === 'expenses' && (
          <ExpensesTab
            form={form}
            setForm={setForm}
            addExpense={addExpense}
            participants={participants}
            addPayerRow={addPayerRow}
            removePayerRow={removePayerRow}
            updatePayer={updatePayer}
            expenses={expenses}
            removeExpense={removeExpense}
            result={result}
          />
        )}

        {tab === 'result' && (
          <ResultTab
            participants={participants}
            expenses={expenses}
            result={result}
            copied={copied}
            copyDebts={copyDebts}
          />
        )}

        {tab === 'archive' && (
          <ArchiveTab
            archives={archives}
            expandedArchive={expandedArchive}
            setExpandedArchive={setExpandedArchive}
            deleteArchive={deleteArchive}
          />
        )}

        {(participants.length > 0 || expenses.length > 0) && (
          <div className="flex gap-3 mt-6">
            <button
              onClick={archiveMangal}
              className="flex-1 py-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 text-sm font-medium transition"
            >
              Kaydet ve Bitir
            </button>
            <button
              onClick={resetAll}
              className="flex-1 py-3 rounded-xl border border-red-900/50 text-red-500 hover:bg-red-900/20 text-sm font-medium transition"
            >
              Sıfırla
            </button>
          </div>
        )}
      </div>

      <WhatsAppImportModal
        isOpen={importModal}
        closeModal={closeModal}
        detected={detected}
        importError={importError}
        dragOver={dragOver}
        setDragOver={setDragOver}
        setDetected={setDetected}
        setImportError={setImportError}
        toggleDetected={toggleDetected}
        confirmImport={confirmImport}
        handleFile={handleFile}
      />
    </div>
  );
}
