// Minimal stubs for store hooks
export interface Selection {
  id: string;
  selection: string;
  type: 'spread' | 'moneyline' | 'over' | 'under';
  odds: number;
  line?: number;
}

export function useBetSlip() {
  return {
    selections: [] as Selection[],
    isExpanded: false,
    stake: 0,
    removeSelection: (id: string) => {},
    clearSelections: () => {},
    toggleExpanded: () => {},
    setStake: (stake: number) => {},
  };
}

export function useSettings() {
  return {
    reduceMotion: false,
  };
}
