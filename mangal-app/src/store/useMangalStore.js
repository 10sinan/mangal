import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const LEGACY_DATA_KEY = 'mangal-data';
const LEGACY_ARCHIVE_KEY = 'mangal-archives';

function loadLegacyData() {
  try {
    const raw = localStorage.getItem(LEGACY_DATA_KEY);
    if (!raw) return { participants: [], expenses: [] };
    const parsed = JSON.parse(raw);
    return {
      participants: Array.isArray(parsed?.participants) ? parsed.participants : [],
      expenses: Array.isArray(parsed?.expenses) ? parsed.expenses : [],
    };
  } catch {
    return { participants: [], expenses: [] };
  }
}

function loadLegacyArchives() {
  try {
    const raw = localStorage.getItem(LEGACY_ARCHIVE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const legacyData = loadLegacyData();
const legacyArchives = loadLegacyArchives();

export const useMangalStore = create(
  persist(
    (set, get) => ({
      participants: legacyData.participants,
      expenses: legacyData.expenses,
      archives: legacyArchives,
      tab: 'participants',

      setTab: (tab) => set({ tab }),

      addParticipant: (name) => {
        const normalizedName = String(name || '').trim();
        if (!normalizedName) return false;

        const exists = get().participants.some(
          (participant) => participant.name.trim().toLowerCase() === normalizedName.toLowerCase(),
        );
        if (exists) return false;

        set((state) => ({
          participants: [...state.participants, { id: crypto.randomUUID(), name: normalizedName }],
        }));
        return true;
      },

      removeParticipant: (id) =>
        set((state) => ({
          participants: state.participants.filter((participant) => participant.id !== id),
          expenses: state.expenses.filter((expense) => expense.paidBy !== id),
        })),

      addExpenses: (newExpenses) =>
        set((state) => ({
          expenses: [...state.expenses, ...newExpenses],
        })),

      removeExpense: (id) =>
        set((state) => ({
          expenses: state.expenses.filter((expense) => expense.id !== id),
        })),

      replaceData: ({ participants, expenses }) =>
        set({
          participants: Array.isArray(participants) ? participants : [],
          expenses: Array.isArray(expenses) ? expenses : [],
        }),

      resetData: () => set({ participants: [], expenses: [] }),

      addArchive: (entry) =>
        set((state) => ({
          archives: [entry, ...state.archives],
        })),

      deleteArchive: (id) =>
        set((state) => ({
          archives: state.archives.filter((archive) => archive.id !== id),
        })),
    }),
    {
      name: 'mangal-store-v1',
      partialize: (state) => ({
        participants: state.participants,
        expenses: state.expenses,
        archives: state.archives,
        tab: state.tab,
      }),
    },
  ),
);
