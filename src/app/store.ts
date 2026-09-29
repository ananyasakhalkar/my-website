import { create } from 'zustand';

interface DeskState {
  introDone: boolean;
  skipRequested: boolean;
  setIntroDone: () => void;
  skipIntro: () => void;
}

export const useDesk = create<DeskState>((set) => ({
  introDone: false,
  skipRequested: false,
  setIntroDone: () => set({ introDone: true }),
  skipIntro: () => set({ skipRequested: true }),
}));
