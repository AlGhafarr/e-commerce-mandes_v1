type EventCallback = () => void;

const listeners: EventCallback[] = [];

export const authEvents = {
  // Fungsi untuk memicu event "Buka Login Modal"
  triggerLoginModal: () => {
    listeners.forEach((callback) => callback());
  },
  
  // Fungsi untuk komponen mendaftarkan diri
  onOpenLoginModal: (callback: EventCallback) => {
    listeners.push(callback);
    // Return fungsi cleanup
    return () => {
      const index = listeners.indexOf(callback);
      if (index > -1) listeners.splice(index, 1);
    };
  }
};