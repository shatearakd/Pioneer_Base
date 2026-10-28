import { useRef, useState } from "react";
import { startDictation, speechRecognitionSupported } from "../lib/voice.js";
import Icon from "./Icon.jsx";

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
      className={`btn ${
        listening
          ? "bg-status-critical text-surface-base pulse-rec"
          : "btn-ghost text-secondary"
      } ${className}`}
    >
      <Icon name={listening ? "graphic_eq" : "mic"} className="text-[18px]" />
      {listening ? "Listening…" : "Voice"}
    </button>
  );
}
