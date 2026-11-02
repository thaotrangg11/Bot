// src/AudioManager.js
export const AudioManager = {
  isSpeaking: false,
  queue: [],
  
  speak: (text) => {
    if (!('speechSynthesis' in window)) return;
    
    AudioManager.queue.push(text);
    if (AudioManager.isSpeaking) return;
    
    AudioManager.processQueue();
  },

  processQueue: () => {
    if (AudioManager.queue.length === 0) {
      AudioManager.isSpeaking = false;
      return;
    }

    AudioManager.isSpeaking = true;
    const text = AudioManager.queue.shift();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 1.1; // Đọc hơi nhanh một chút cho dồn dập
    utterance.pitch = 1.0;
    
    utterance.onend = () => {
      AudioManager.processQueue();
    };
    utterance.onerror = () => {
      AudioManager.processQueue();
    };

    window.speechSynthesis.speak(utterance);
  }
};
