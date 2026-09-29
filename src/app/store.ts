import { create } from 'zustand';

interface DeskState {
  introDone: boolean;
  skipRequested: boolean;
  /** Which desk object the pointer is over (drives lift, rim light and tag). */
  hovered: string | null;
  /** The first frame has rendered. */
  ready: boolean;
  /** The loader has slid away (the intro starts then). */
  loaderDone: boolean;
  /** Offer the lightweight version (sustained low FPS). */
  slowOffer: boolean;
  slowDismissed: boolean;
  setIntroDone: () => void;
  skipIntro: () => void;
  setHovered: (id: string | null) => void;
  setReady: () => void;
  setLoaderDone: () => void;
  offerSlow: () => void;
  dismissSlow: () => void;
}

export const useDesk = create<DeskState>((set) => ({
  introDone: false,
  skipRequested: false,
  hovered: null,
  ready: false,
  loaderDone: false,
  slowOffer: false,
  slowDismissed: false,
  setIntroDone: () => set({ introDone: true }),
  skipIntro: () => set({ skipRequested: true }),
  setHovered: (id) => set({ hovered: id }),
  setReady: () => set({ ready: true }),
  setLoaderDone: () => set({ loaderDone: true }),
  offerSlow: () => set((s) => (s.slowDismissed ? s : { slowOffer: true })),
  dismissSlow: () => set({ slowOffer: false, slowDismissed: true }),
}));
