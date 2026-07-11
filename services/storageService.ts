
import { AppState } from '../types';

// This service mimics a backend persistence layer (Supabase).
// Currently uses LocalStorage for offline-first capability.

const STORAGE_KEY = 'sovereign_wealth_os_v1';

export const saveState = (state: AppState) => {
    try {
        const serialized = JSON.stringify(state);
        localStorage.setItem(STORAGE_KEY, serialized);
        // console.log("State persisted to local fortress.");
    } catch (e) {
        console.error("Failed to persist state", e);
    }
};

export const loadState = (): AppState | null => {
    try {
        const serialized = localStorage.getItem(STORAGE_KEY);
        if (!serialized) return null;
        return JSON.parse(serialized) as AppState;
    } catch (e) {
        console.error("Failed to load state", e);
        return null;
    }
};

export const clearState = () => {
    localStorage.removeItem(STORAGE_KEY);
};
