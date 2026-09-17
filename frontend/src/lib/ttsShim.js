import { supabase } from "./supabaseClient";

// Shims window.speechSynthesis / SpeechSynthesisUtterance on top of the
// deployed `text-to-speech` Edge Function (Google Cloud Neural2 voice), so
// App.jsx's existing speak() logic (cancel + new Utterance + .speak(u))
// works completely unmodified.
export function installTtsShim() {
  const audioCache = new Map(); // text -> base64 mp3, avoids re-fetching repeated words
  let currentAudio = null;

  function stopCurrent() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
  }

  const shimUtterance = function SpeechSynthesisUtterance(text) {
    this.text = text;
    this.lang = "";
    this.voice = null;
    this.rate = 1;
  };

  const shimSynthesis = {
    getVoices() {
      return [];
    },
    onvoiceschanged: null,
    cancel: stopCurrent,
    async speak(utterance) {
      const text = utterance && utterance.text;
      if (!text) return;
      try {
        let audioContent = audioCache.get(text);
        if (!audioContent) {
          const { data, error } = await supabase.functions.invoke("text-to-speech", {
            body: { text },
          });
          if (error) throw error;
          audioContent = data.audioContent;
          audioCache.set(text, audioContent);
        }
        stopCurrent();
        const audio = new Audio("data:audio/mp3;base64," + audioContent);
        currentAudio = audio;
        audio.play().catch(() => {});
      } catch (e) {
        console.error("TTS failed:", e);
      }
    },
  };

  // Chrome/Edge define `window.speechSynthesis` as a getter-only accessor
  // (part of the native Web Speech API), so a plain assignment throws
  // "Cannot set property speechSynthesis of #<Window> which has only a
  // getter". Object.defineProperty overrides it instead.
  Object.defineProperty(window, "SpeechSynthesisUtterance", {
    value: shimUtterance,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, "speechSynthesis", {
    value: shimSynthesis,
    writable: true,
    configurable: true,
  });
}
