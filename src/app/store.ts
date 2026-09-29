import { create } from 'zustand';

interface DeskState {
  introDone: boolean;
  skipRequested: boolean;
  /** Which desk object the pointer is over (drives lift, rim light and tag). */
  hovered: string | null;
  setIntroDone: () => void;
  skipIntro: () => void;
  setHovered: (id: string | null) => void;
}

export const useDesk = create<DeskState>((set) => ({
  introDone: false,
  skipRequested: false,
  hovered: null,
  setIntroDone: () => set({ introDone: true }),
  skipIntro: () => set({ skipRequested: true }),
  setHovered: (id) => set({ hovered: id }),
}));
