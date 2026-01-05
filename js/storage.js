const STORAGE_KEY = 'infotic_evidences';

export const Storage = {
    get() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading from localStorage', e);
            return [];
        }
    },
    
    add(evidence) {
        try {
            const list = this.get();
            list.push(evidence);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
            return true;
        } catch (e) {
            console.error('Error saving to localStorage', e);
            return false;
        }
    },
    
    clear() {
        localStorage.removeItem(STORAGE_KEY);
    }
};
