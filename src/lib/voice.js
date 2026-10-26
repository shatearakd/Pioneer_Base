// Voice helpers: speech-to-text via the Web Speech API and raw audio capture
// via MediaRecorder. Both run entirely on-device (speech recognition may use
// the OS/browser engine; no app server is involved).

export function speechRecognitionSupported() {
  return (
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
}

// Start dictation. Calls onResult with the accumulated transcript as the user
// speaks. Returns a stop() function.
export function startDictation({ onResult, onEnd, onError, lang = "en-US" } = {}) {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) throw new Error("Speech recognition not supported in this browser.");
  const rec = new Ctor();
  rec.lang = lang;
  rec.continuous = true;
  rec.interimResults = true;

  let finalText = "";
  rec.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalText += transcript;
      else interim += transcript;
    }
    onResult?.((finalText + interim).trim(), { final: finalText.trim(), interim });
  };
  rec.onerror = (e) => onError?.(e.error || "recognition-error");
  rec.onend = () => onEnd?.(finalText.trim());

  rec.start();
  return () => {
    try {
      rec.stop();
    } catch {
      /* ignore */
    }
  };
}

export function mediaRecorderSupported() {
  return typeof window !== "undefined" && "MediaRecorder" in window;
}

// Record audio from the microphone. Returns a controller with stop() -> Blob.
export async function recordAudio() {
  if (!mediaRecorderSupported()) throw new Error("Recording not supported.");
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const chunks = [];
  const mime = MediaRecorder.isTypeSupported("audio/webm")
    ? "audio/webm"
    : "";
  const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  recorder.start();

  return {
    recorder,
    stop: () =>
      new Promise((resolve) => {
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          resolve(new Blob(chunks, { type: mime || "audio/webm" }));
        };
        recorder.stop();
      }),
  };
}
