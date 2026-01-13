import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Settings {
  reduceMotion: boolean;
  themeIntensity: 'low' | 'normal' | 'high';
  scanMode: boolean;
  futureSlider: number;
  onboardingComplete: boolean;
  showOnboarding: boolean;
}

interface SettingsStore extends Settings {
  setReduceMotion: (value: boolean) => void;
  setThemeIntensity: (value: 'low' | 'normal' | 'high') => void;
  setScanMode: (value: boolean) => void;
  setFutureSlider: (value: number) => void;
  setOnboardingComplete: (value: boolean) => void;
  setShowOnboarding: (value: boolean) => void;
  resetSettings: () => void;
}

const defaultSettings: Settings = {
  reduceMotion: false,
  themeIntensity: 'normal',
  scanMode: false,
  futureSlider: 50,
  onboardingComplete: false,
  showOnboarding: true,
};

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setReduceMotion: (value) => set({ reduceMotion: value }),
      setThemeIntensity: (value) => set({ themeIntensity: value }),
      setScanMode: (value) => set({ scanMode: value }),
      setFutureSlider: (value) => set({ futureSlider: value }),
      setOnboardingComplete: (value) => set({ onboardingComplete: value, showOnboarding: !value }),
      setShowOnboarding: (value) => set({ showOnboarding: value }),
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'nexus-settings',
    }
  )
);

export interface BetSelection {
  id: string;
  gameId: number;
  type: 'spread' | 'moneyline' | 'total' | 'prop';
  selection: string;
  odds: number;
  team?: string;
  line?: number;
}

interface BetSlipStore {
  selections: BetSelection[];
  isExpanded: boolean;
  stake: number;
  addSelection: (selection: BetSelection) => void;
  removeSelection: (id: string) => void;
  clearSelections: () => void;
  toggleExpanded: () => void;
  setExpanded: (value: boolean) => void;
  setStake: (value: number) => void;
}

export const useBetSlip = create<BetSlipStore>()(
  persist(
    (set) => ({
      selections: [],
      isExpanded: false,
      stake: 100,
      addSelection: (selection) =>
        set((state) => {
          const exists = state.selections.find((s) => s.id === selection.id);
          if (exists) return state;
          return { selections: [...state.selections, selection] };
        }),
      removeSelection: (id) =>
        set((state) => ({
          selections: state.selections.filter((s) => s.id !== id),
        })),
      clearSelections: () => set({ selections: [] }),
      toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),
      setExpanded: (value) => set({ isExpanded: value }),
      setStake: (value) => set({ stake: value }),
    }),
    {
      name: 'nexus-betslip',
    }
  )
);
