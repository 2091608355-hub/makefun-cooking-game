// Sizzle & Serve — tiny sounds, made with the Web Audio API and nothing else.
// No audio files: every sound is an oscillator blip, so the game loads nothing over the network.
export function createSound() {
  let context = null;
  let muted = false;

  function ensure() {
    if (!context) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        context = new AudioContext();
      } catch {
        context = null;
      }
    }
    if (context && context.state === 'suspended') context.resume();
    return context;
  }

  function blip(frequency, seconds, type = 'sine', volume = 0.12) {
    if (muted) return;
    const audio = ensure();
    if (!audio) return;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + seconds);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + seconds);
  }

  return {
    toggleMute() {
      muted = !muted;
      return muted;
    },
    pick() {
      blip(520, 0.07, 'triangle', 0.08);
    },
    place() {
      blip(340, 0.08, 'triangle', 0.1);
    },
    chop() {
      blip(180, 0.06, 'square', 0.07);
    },
    sizzle() {
      blip(1200, 0.15, 'sawtooth', 0.03);
    },
    ready() {
      blip(660, 0.09, 'sine', 0.1);
      setTimeout(() => blip(880, 0.12, 'sine', 0.1), 90);
    },
    serve() {
      [523, 659, 784].forEach((f, i) => setTimeout(() => blip(f, 0.14, 'triangle', 0.12), i * 90));
    },
    error() {
      blip(140, 0.18, 'square', 0.08);
    },
    expire() {
      blip(220, 0.3, 'sawtooth', 0.08);
    },
    over() {
      [392, 330, 262].forEach((f, i) => setTimeout(() => blip(f, 0.22, 'triangle', 0.1), i * 140));
    },
  };
}
