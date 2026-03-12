import { create } from 'zustand';

interface AlertState {
  unreadCount: number;
}

interface AlertActions {
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  clearUnread: () => void;
}

type AlertStore = AlertState & AlertActions;

export const useAlertStore = create<AlertStore>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count: number) =>
    set({
      unreadCount: count,
    }),
  incrementUnread: () =>
    set((state) => ({
      unreadCount: state.unreadCount + 1,
    })),
  clearUnread: () =>
    set({
      unreadCount: 0,
    }),
}));

