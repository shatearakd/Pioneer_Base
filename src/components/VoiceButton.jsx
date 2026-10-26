import { useRef, useState } from "react";
import { startDictation, speechRecognitionSupported } from "../lib/voice.js";

// Mic button that dictates speech into text. Calls onTranscript(text) with the
// live transcript, and onFinal(text) when dictation ends.
export default function VoiceButton({ onTranscript, onFinal, className = "" }) {
  const [listening, setListening] = useState(false);
  const stopRef = useRef(null);
  const supported = speechRecognitionSupported();

  function toggle() {
    if (listening) {
      stopRef.current?.();
      return;
    }
    try {
      stopRef.current = startDictation({
        onResult: (text) => onTranscript?.(text),
        onEnd: (finalText) => {
          setListening(false);
          onFinal?.(finalText);
        },
        onError: () => setListening(false),
      });
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      title={listening ? "Stop dictation" : "Dictate with your voice"}
      className={`btn ${listening ? "bg-tangerine text-base-950 pulse-rec" : "btn-ghost"} ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0" />
        <path d="M12 18v3" />
      </svg>
      {listening ? "Listening…" : "Voice"}
    </button>
  );
}
