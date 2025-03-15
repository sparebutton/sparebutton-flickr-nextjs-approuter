import { create } from "zustand";

type DialogStore = {
    openDialogs: Record<string, boolean>; // 各ダイアログの開閉状態を管理
    isOpen: boolean; // いずれかのダイアログが開いているかを判定
    open: (dialogId: string) => void;
    close: (dialogId: string) => void;
};

export const useDialogStore = create<DialogStore>((set, get) => ({
    openDialogs: {},
    isOpen: false, // 初期状態は false

    open: (dialogId) => {
        set((state) => {
            const updatedDialogs = { ...state.openDialogs, [dialogId]: true };
            return { openDialogs: updatedDialogs, isOpen: Object.values(updatedDialogs).some((v) => v) };
        });
    },

    close: (dialogId) => {
        set((state) => {
            const updatedDialogs = { ...state.openDialogs, [dialogId]: false };
            return { openDialogs: updatedDialogs, isOpen: Object.values(updatedDialogs).some((v) => v) };
        });
    },
}));
