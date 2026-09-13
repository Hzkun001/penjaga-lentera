type Bus = "music" | "sfx" | "ambient" | "ui";
type AudioId =
  | "ui.click" | "ui.confirm" | "dialogue.advance" | "world.transition"
  | "fishing.trash" | "fishing.catch" | "tool.wood" | "tool.hit"
  | "commerce.sell" | "world.sleep" | "loot.potion" | "healing"
  | "loot.crystal" | "potion.use" | "tool.swing" | "combat.swing"
  | "combat.hit" | "combat.hurt" | "game.start" | "game.complete"
  | "player.footstep";

type Sound = { bus: Bus; frequency: number; wave?: OscillatorType; duration?: number; gain?: number };
type Point = { x: number; y: number };
type Settings = { enabled: boolean; master: number; music: number; sfx: number; ambient: number; ui: number };

const storageKey = "lentera-audio-v1";
const defaults: Settings = { enabled: true, master: 0.7, music: 0.65, sfx: 0.7, ambient: 0.5, ui: 0.6 };
const sounds: Record<AudioId, Sound> = {
  "ui.click": { bus: "ui", frequency: 520, wave: "square", duration: 0.035, gain: 0.05 },
  "ui.confirm": { bus: "ui", frequency: 740, wave: "triangle", duration: 0.1 },
  "dialogue.advance": { bus: "ui", frequency: 620, wave: "triangle", duration: 0.06, gain: 0.06 },
  "world.transition": { bus: "ambient", frequency: 530, wave: "sine", duration: 0.18 },
  "fishing.trash": { bus: "sfx", frequency: 180, wave: "triangle", duration: 0.14 },
  "fishing.catch": { bus: "sfx", frequency: 880, wave: "triangle", duration: 0.16 },
  "tool.wood": { bus: "sfx", frequency: 440, wave: "triangle", duration: 0.1 },
  "tool.hit": { bus: "sfx", frequency: 520, wave: "square", duration: 0.07 },
  "commerce.sell": { bus: "ui", frequency: 980, wave: "triangle", duration: 0.15 },
  "world.sleep": { bus: "ambient", frequency: 720, wave: "sine", duration: 0.18 },
  "loot.potion": { bus: "ui", frequency: 920, wave: "triangle", duration: 0.14 },
  healing: { bus: "sfx", frequency: 720, wave: "sine", duration: 0.18 },
  "loot.crystal": { bus: "sfx", frequency: 880, wave: "sine", duration: 0.22 },
  "potion.use": { bus: "sfx", frequency: 760, wave: "sine", duration: 0.16 },
  "tool.swing": { bus: "sfx", frequency: 350, wave: "triangle", duration: 0.09, gain: 0.06 },
  "combat.swing": { bus: "sfx", frequency: 190, wave: "sawtooth", duration: 0.11, gain: 0.08 },
  "combat.hit": { bus: "sfx", frequency: 110, wave: "square", duration: 0.11 },
  "combat.hurt": { bus: "sfx", frequency: 140, wave: "sawtooth", duration: 0.16 },
  "game.start": { bus: "ui", frequency: 440, wave: "triangle", duration: 0.12 },
  "game.complete": { bus: "ui", frequency: 1046, wave: "triangle", duration: 0.28 },
  "player.footstep": { bus: "sfx", frequency: 105, wave: "triangle", duration: 0.035, gain: 0.05 },
};

function loadSettings(): Settings {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null") as Partial<Settings> | null;
    return saved ? {
      enabled: typeof saved.enabled === "boolean" ? saved.enabled : defaults.enabled,
      master: clamp(saved.master ?? defaults.master),
      music: clamp(saved.music ?? defaults.music),
      sfx: clamp(saved.sfx ?? defaults.sfx),
      ambient: clamp(saved.ambient ?? defaults.ambient),
      ui: clamp(saved.ui ?? defaults.ui),
    } : { ...defaults };
  } catch { return { ...defaults }; }
}
const clamp = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

class GameAudio {
  settings = loadSettings();
  private context?: AudioContext;
  private master?: GainNode;
  private buses?: Record<Bus, GainNode>;
  private voices: OscillatorNode[] = [];
  private music?: { element: HTMLAudioElement; gain: GainNode; source: MediaElementAudioSourceNode; id: string };

  private save() {
    try { localStorage.setItem(storageKey, JSON.stringify(this.settings)); } catch { /* Optional browser storage. */ }
  }
  private setup() {
    if (this.context) return this.context;
    try {
      const context = new AudioContext();
      const master = context.createGain();
      const buses = Object.fromEntries((["music", "sfx", "ambient", "ui"] as Bus[]).map(bus => {
        const gain = context.createGain();
        gain.connect(master);
        return [bus, gain];
      })) as Record<Bus, GainNode>;
      master.connect(context.destination);
      this.context = context;
      this.master = master;
      this.buses = buses;
      this.apply();
      return context;
    } catch { return undefined; }
  }
  private apply() {
    if (!this.context || !this.master || !this.buses) return;
    const now = this.context.currentTime;
    this.master.gain.setTargetAtTime(this.settings.enabled ? this.settings.master : 0, now, 0.025);
    for (const bus of ["music", "sfx", "ambient", "ui"] as Bus[])
      this.buses[bus].gain.setTargetAtTime(this.settings[bus], now, 0.025);
  }
  setEnabled(enabled: boolean) { this.settings.enabled = enabled; this.save(); this.apply(); }
  setVolume(bus: "master" | Bus, value: number) {
    this.settings[bus] = clamp(value); this.save(); this.apply();
  }
  crow() {
    if (!this.settings.enabled) return;
    const context=this.setup();
    if(!context || !this.buses) return;
    void context.resume().catch(()=>{});
    // Four syllables with a falling final call, authored for the pixel soundscape.
    for(const [offset,duration,pitch] of [[0,0.16,620],[0.22,0.19,790],[0.48,0.24,920],[0.78,0.85,740]]) {
      const voice=context.createOscillator(), gain=context.createGain(), filter=context.createBiquadFilter();
      const start=context.currentTime+offset;
      voice.type="sawtooth";
      voice.frequency.setValueAtTime(pitch*0.75,start);
      voice.frequency.exponentialRampToValueAtTime(pitch,start+0.06);
      voice.frequency.exponentialRampToValueAtTime(pitch*0.62,start+duration);
      filter.type="bandpass";filter.frequency.value=1400;filter.Q.value=0.8;
      gain.gain.setValueAtTime(0.0001,start);
      gain.gain.exponentialRampToValueAtTime(0.18,start+0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001,start+duration);
      voice.connect(filter).connect(gain).connect(this.buses.ambient);
      voice.onended=()=>{voice.disconnect();filter.disconnect();gain.disconnect();};
      voice.start(start);voice.stop(start+duration+0.02);
    }
  }
  play(id: AudioId) { this.emit(id); }
  playLocal(id: AudioId, source: Point, listener: Point) { this.emit(id, source, listener); }
  private emit(id: AudioId, source?: Point, listener?: Point) {
    if (!this.settings.enabled) return;
    const spec = sounds[id];
    if (!spec) return;
    const context = this.setup();
    if (!context || !this.buses) return;
    void context.resume().catch(() => {});
    if (this.voices.length >= 8) this.voices.shift()?.stop();
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = spec.wave ?? "sine";
    oscillator.frequency.value = spec.frequency * (0.97 + Math.random() * 0.06);
    const duration = spec.duration ?? 0.12;
    const now = context.currentTime;
    const level = spec.gain ?? 0.1;
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(level, now + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(envelope);
    if (source && listener && id !== "player.footstep") {
      const spatial = context.createStereoPanner();
      const distanceGain = context.createGain();
      const dx = source.x - listener.x, dy = source.y - listener.y;
      const distance = Math.hypot(dx, dy);
      spatial.pan.value = clamp((dx / 220 + 1) / 2) * 2 - 1;
      distanceGain.gain.value = Math.max(0.12, 1 - distance / 500);
      envelope.connect(distanceGain);
      distanceGain.connect(spatial);
      spatial.connect(this.buses[spec.bus]);
    } else envelope.connect(this.buses[spec.bus]);
    oscillator.onended = () => { this.voices = this.voices.filter(voice => voice !== oscillator); };
    this.voices.push(oscillator);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  crossfadeMusic(id: string, url?: string, seconds = 2) {
    if (!url) return;
    if (this.music?.id === id) {
      const current = this.music, context = this.context;
      if (current.element.paused && context)
        void context.resume().then(() => current.element.play()).catch(() => {});
      return;
    }
    const context = this.setup();
    if (!context || !this.buses) return;
    void context.resume().catch(() => {});
    const element = new Audio(url);
    element.loop = true;
    element.preload = "auto";
    const source = context.createMediaElementSource(element);
    const gain = context.createGain();
    gain.gain.value = 0;
    source.connect(gain).connect(this.buses.music);
    const previous = this.music;
    this.music = { element, source, gain, id };
    const now = context.currentTime;
    gain.gain.setTargetAtTime(1, now, Math.max(0.03, seconds / 3));
    if (previous) previous.gain.gain.setTargetAtTime(0, now, Math.max(0.03, seconds / 3));
    void element.play().then(() => {
      if (previous) window.setTimeout(() => { previous.element.pause(); previous.source.disconnect(); previous.gain.disconnect(); }, seconds * 1000 + 150);
    }).catch(() => {
      if (this.music?.element === element) this.music = previous;
      source.disconnect(); gain.disconnect();
    });
  }
  stopMusic(seconds = 1) {
    const current = this.music;
    if (!current || !this.context) return;
    this.music = undefined;
    current.gain.gain.setTargetAtTime(0, this.context.currentTime, Math.max(0.03, seconds / 3));
    window.setTimeout(() => { current.element.pause(); current.source.disconnect(); current.gain.disconnect(); }, seconds * 1000 + 150);
  }
}

export const audio = new GameAudio();
