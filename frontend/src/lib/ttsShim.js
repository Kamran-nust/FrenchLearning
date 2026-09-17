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

  window.SpeechSynthesisUtterance = function SpeechSynthesisUtterance(text) {
    this.text = text;
    this.lang = "";
    this.voice = null;
    this.rate = 1;
  };

  window.speechSynthesis = {
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
}
