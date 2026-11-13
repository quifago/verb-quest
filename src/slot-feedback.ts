export const SLOT_CHECK_MS = 650;

type Cue = "tick" | "match" | "miss";
let audio: AudioContext | undefined;

export async function prepareSlotAudio() {
  try {
    if (!window.AudioContext) return;
    audio ??= new AudioContext();
    if (audio.state !== "running") await audio.resume();
    return audio;
  } catch {
    // Audio can be unavailable or blocked by the browser.
  }
}

function tone(context: AudioContext, time: number, pitch: number, length: number, volume: number, type: OscillatorType) {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(pitch, time);
  oscillator.frequency.exponentialRampToValueAtTime(pitch * .82, time + length / 2);
  envelope.gain.setValueAtTime(.0001, time);
  envelope.gain.linearRampToValueAtTime(volume, time + .002);
  envelope.gain.exponentialRampToValueAtTime(.0001, time + length);
  oscillator.connect(envelope).connect(context.destination);
  oscillator.start(time);
  oscillator.stop(time + length);
  oscillator.onended = () => {
    oscillator.disconnect();
    envelope.disconnect();
  };
}

function clack(context: AudioContext, time: number, pitch: number, volume: number) {
  tone(context, time, pitch, .032, volume, "square");
  tone(context, time, 210, .048, volume * .8, "triangle");
}

function playSound(context: AudioContext, cue: Cue, reduced: boolean) {
  const start = context.currentTime + .01;
  if (cue === "tick") {
    clack(context, start, 810, .045);
    return;
  }

  if (!reduced) {
    const offsets = [0, .051, .104, .163, .231, .309, .402, .517];
    offsets.forEach((offset, index) => clack(context, start + offset, 1080 - index * 49, .038));
  }

  const stop = start + (reduced ? 0 : SLOT_CHECK_MS / 1000);
  clack(context, stop, 465, .052);
  if (cue === "match") {
    for (const [index, pitch] of [659, 831, 988].entries()) {
      tone(context, stop + .035 + index * .065, pitch, .16, .05, "sine");
    }
  } else {
    tone(context, stop + .035, 332, .13, .04, "triangle");
  }
}

export function playSlotFeedback(cue: Cue) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pattern = cue === "tick" ? 12 : reduced ? 30 : [18, 54, 18, 66, 21, 74, 24, 94, 28, 111, 45];
  navigator.vibrate?.(pattern);

  const requestedAt = performance.now();
  void prepareSlotAudio().then((context) => {
    // A suspended context can resolve much later, after the interaction has passed.
    if (context?.state === "running" && performance.now() - requestedAt < 200) {
      playSound(context, cue, reduced);
    }
  }).catch(() => {});
}
