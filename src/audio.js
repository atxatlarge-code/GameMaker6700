// Web Audio API Sound and Music Engine
const TRACKS = {
  mario: {
    tempo: 160,
    steps: [
      // Bar 1
      { lead: 76, bass: 48 }, { lead: 76 }, {}, { lead: 76, bass: 55 },
      {}, { lead: 72, bass: 48 }, { lead: 76 }, {},
      // Bar 2
      { lead: 79, bass: 55 }, {}, {}, {}, { lead: 67, bass: 43 }, {}, {}, {},
      // Bar 3
      { lead: 72, bass: 48 }, {}, {}, { lead: 67, bass: 52 }, {}, {}, { lead: 64, bass: 48 }, {},
      // Bar 4
      {}, { lead: 69, bass: 53 }, {}, { lead: 71, bass: 55 }, {}, { lead: 70, bass: 54 }, { lead: 69, bass: 53 }, {},
      // Bar 5
      { lead: 67, bass: 48 }, { lead: 76, bass: 52 }, {}, { lead: 79, bass: 55 }, { lead: 81, bass: 60 }, {}, { lead: 77, bass: 53 }, { lead: 79 },
      // Bar 6
      {}, { lead: 76, bass: 48 }, {}, { lead: 72, bass: 45 }, { lead: 74, bass: 50 }, { lead: 71, bass: 43 }, {}, {},
      // Bar 7
      { lead: 72, bass: 48 }, {}, {}, { lead: 67, bass: 52 }, {}, {}, { lead: 64, bass: 48 }, {},
      // Bar 8
      {}, { lead: 69, bass: 53 }, {}, { lead: 71, bass: 55 }, {}, { lead: 74, bass: 55 }, { lead: 72, bass: 48 }, {}
    ]
  },
  adventure: {
    tempo: 140,
    steps: (() => {
      const steps = [];
      // Am (steps 0-15)
      const amArp = [69, 72, 76, 81, 76, 72, 69, 72, 76, 81, 76, 72, 69, 72, 76, 72];
      for(let i=0; i<16; i++) {
        steps.push({ lead: amArp[i], bass: (i % 4 === 0) ? 45 : (i % 2 === 0 ? 57 : null) });
      }
      // F (steps 16-31)
      const fArp = [65, 69, 72, 77, 72, 69, 65, 69, 72, 77, 72, 69, 65, 69, 72, 69];
      for(let i=0; i<16; i++) {
        steps.push({ lead: fArp[i], bass: (i % 4 === 0) ? 41 : (i % 2 === 0 ? 53 : null) });
      }
      // C (steps 32-47)
      const cArp = [60, 64, 67, 72, 67, 64, 60, 64, 67, 72, 67, 64, 60, 64, 67, 64];
      for(let i=0; i<16; i++) {
        steps.push({ lead: cArp[i], bass: (i % 4 === 0) ? 48 : (i % 2 === 0 ? 60 : null) });
      }
      // G (steps 48-63)
      const gArp = [67, 71, 74, 79, 74, 71, 67, 71, 74, 79, 74, 71, 67, 71, 74, 71];
      for(let i=0; i<16; i++) {
        steps.push({ lead: gArp[i], bass: (i % 4 === 0) ? 43 : (i % 2 === 0 ? 55 : null) });
      }
      return steps;
    })()
  },
  lullaby: {
    tempo: 110,
    steps: (() => {
      const steps = [];
      const bar1 = [
        { lead: 76, bass: 48 }, {}, { arp: 67 }, { arp: 71 },
        { lead: 79 }, {}, { arp: 67 }, { arp: 71 },
        { lead: 76 }, {}, { arp: 67 }, { arp: 71 },
        { lead: 74 }, {}, { arp: 67 }, { arp: 71 }
      ];
      const bar2 = [
        { lead: 72, bass: 45 }, {}, { arp: 64 }, { arp: 67 },
        { lead: 76 }, {}, { arp: 64 }, { arp: 67 },
        { lead: 72 }, {}, { arp: 64 }, { arp: 67 },
        { lead: 71 }, {}, { arp: 64 }, { arp: 67 }
      ];
      const bar3 = [
        { lead: 69, bass: 41 }, {}, { arp: 60 }, { arp: 64 },
        { lead: 72 }, {}, { arp: 60 }, { arp: 64 },
        { lead: 69 }, {}, { arp: 60 }, { arp: 64 },
        { lead: 67 }, {}, { arp: 60 }, { arp: 64 }
      ];
      const bar4 = [
        { lead: 74, bass: 43 }, {}, { arp: 62 }, { arp: 65 },
        { lead: 71 }, {}, { arp: 62 }, { arp: 65 },
        { lead: 67 }, {}, { arp: 62 }, { arp: 65 },
        { lead: 72, bass: 48 }, {}, {}, {}
      ];
      steps.push(...bar1, ...bar2, ...bar3, ...bar4);
      return steps;
    })()
  },
  bonjovi: {
    tempo: 125,
    steps: (() => {
      const steps = [];
      // 64 steps total (4 bars of 16 16th notes)
      for (let i = 0; i < 64; i++) {
        steps.push({});
      }

      // Lead melody (Chorus of Livin' on a Prayer)
      // Bar 1: "Whoa, we're half way there"
      steps[0].lead = 76; // E5
      steps[6].lead = 74; // D5
      steps[8].lead = 76; // E5
      steps[10].lead = 78; // F#5
      steps[12].lead = 79; // G5
      steps[14].lead = 78; // F#5

      // Bar 2: "Whoa-oh, livin' on a prayer"
      steps[16].lead = 79; // G5
      steps[22].lead = 78; // F#5
      steps[24].lead = 76; // E5
      steps[26].lead = 74; // D5
      steps[28].lead = 71; // B4
      steps[29].lead = 74; // D5
      steps[30].lead = 76; // E5

      // Bar 3: "Take my hand, we'll make it I swear"
      steps[32].lead = 76; // E5
      steps[34].lead = 78; // F#5
      steps[36].lead = 79; // G5
      steps[40].lead = 79; // G5
      steps[42].lead = 78; // F#5
      steps[44].lead = 76; // E5
      steps[45].lead = 74; // D5
      steps[46].lead = 78; // F#5

      // Bar 4: "Whoa-oh, livin' on a prayer"
      steps[48].lead = 79; // G5
      steps[54].lead = 78; // F#5
      steps[56].lead = 76; // E5
      steps[58].lead = 74; // D5
      steps[60].lead = 71; // B4
      steps[61].lead = 74; // D5
      steps[62].lead = 76; // E5

      // Bassline (8th notes: 0, 2, 4, 6, 8, 10, 12, 14 in each bar)
      // Bar 1: Em (52) for 1st half, C (48) for 2nd half
      [0, 2, 4, 6].forEach(i => steps[i].bass = 52);
      [8, 10, 12, 14].forEach(i => steps[i].bass = 48);

      // Bar 2: D (50) for 1st half, Em (52) for 2nd half
      [16, 18, 20, 22].forEach(i => steps[i].bass = 50);
      [24, 26, 28, 30].forEach(i => steps[i].bass = 52);

      // Bar 3: Em (52) for 1st half, C (48) for 2nd half
      [32, 34, 36, 38].forEach(i => steps[i].bass = 52);
      [40, 42, 44, 46].forEach(i => steps[i].bass = 48);

      // Bar 4: D (50) for 1st half, Em (52) for 2nd half
      [48, 50, 52, 54].forEach(i => steps[i].bass = 50);
      [56, 58, 60, 62].forEach(i => steps[i].bass = 52);

      // Rhythmic arpeggio accompaniment (off-beats 1, 3, 5, 7, 9, 11, 13, 15)
      for (let bar = 0; bar < 4; bar++) {
        const offset = bar * 16;
        const isEm = (bar === 0 || bar === 2);
        const arp1 = isEm ? [59, 64, 67] : [57, 62, 66]; // Em vs D
        const arp2 = isEm ? [55, 60, 64] : [59, 64, 67]; // C vs Em

        [1, 3, 5, 7].forEach((step, idx) => {
          steps[offset + step].arp = arp1[idx % arp1.length];
        });
        [9, 11, 13, 15].forEach((step, idx) => {
          steps[offset + step].arp = arp2[idx % arp2.length];
        });
      }

      return steps;
    })()
  },
  blackeyedpeas: {
    tempo: 128,
    steps: (() => {
      const steps = [];
      for (let i = 0; i < 64; i++) {
        steps.push({});
      }

      // Lead melody: "I Gotta Feeling (Tonight's gonna be a good night)"
      // Bar 1 (G)
      steps[0].lead = 71; // B4
      steps[2].lead = 71; 
      steps[4].lead = 71; 
      steps[6].lead = 71; 
      steps[8].lead = 67; // G4
      steps[12].lead = 71; // B4
      steps[14].lead = 71;

      // Bar 2 (C)
      steps[16].lead = 71; // B4
      steps[18].lead = 71;
      steps[20].lead = 71;
      steps[22].lead = 69; // A4
      steps[24].lead = 67; // G4
      steps[26].lead = 69; // A4
      steps[28].lead = 67; // G4

      // Bar 3 (Em)
      steps[32].lead = 71; // B4
      steps[34].lead = 71;
      steps[36].lead = 71;
      steps[38].lead = 71;
      steps[40].lead = 71;
      steps[42].lead = 69; // A4
      steps[44].lead = 67; // G4
      steps[46].lead = 69; // A4

      // Bar 4 (C)
      steps[48].lead = 67; // G4
      steps[52].lead = 71; // B4
      steps[56].lead = 69; // A4
      steps[60].lead = 67; // G4

      // Four on the floor / pop bassline (even steps 0, 2, 4...)
      const bassNotes = [55, 48, 52, 48]; // G3, C3, E3, C3
      for (let bar = 0; bar < 4; bar++) {
        const offset = bar * 16;
        const bNote = bassNotes[bar];
        for (let s = 0; s < 16; s += 2) {
          steps[offset + s].bass = bNote;
        }
      }

      // Iconic intro synth arpeggio rhythm (3 + 3 + 2 pattern: 0, 3, 6, 8, 11, 14)
      const arps = [
        [55, 62, 67], // G triad
        [60, 67, 72], // C triad
        [59, 64, 71], // Em triad
        [60, 67, 72]  // C triad
      ];
      for (let bar = 0; bar < 4; bar++) {
        const offset = bar * 16;
        const chord = arps[bar];
        [0, 3, 6, 8, 11, 14].forEach((s, idx) => {
          steps[offset + s].arp = chord[idx % chord.length];
        });
      }

      return steps;
    })()
  },
  ladygaga: {
    tempo: 119,
    steps: (() => {
      const steps = [];
      for (let i = 0; i < 64; i++) {
        steps.push({});
      }

      // Lead melody: "Bad Romance" (Rah rah ah ah ah...)
      // Bar 1 (Am)
      steps[0].lead = 69; // A4
      steps[2].lead = 69;
      steps[4].lead = 72; // C5
      steps[6].lead = 69;
      steps[8].lead = 69;
      steps[10].lead = 72; // C5
      steps[12].lead = 72;
      steps[14].lead = 76; // E5

      // Bar 2 (C)
      steps[16].lead = 72; // C5
      steps[18].lead = 72;
      steps[20].lead = 69; // A4
      steps[22].lead = 69;
      steps[24].lead = 72; // C5
      steps[26].lead = 71; // B4
      steps[28].lead = 69; // A4

      // Bar 3 (F)
      steps[32].lead = 76; // E5
      steps[34].lead = 76;
      steps[36].lead = 74; // D5
      steps[38].lead = 72; // C5
      steps[40].lead = 71; // B4

      // Bar 4 (G)
      steps[48].lead = 76; // E5
      steps[50].lead = 76;
      steps[52].lead = 74; // D5
      steps[54].lead = 72; // C5
      steps[56].lead = 69; // A4

      // Pulsing 8th note synthpop bassline (even steps)
      const bassNotes = [45, 48, 41, 43]; // A2, C3, F2, G2
      for (let bar = 0; bar < 4; bar++) {
        const offset = bar * 16;
        const bNote = bassNotes[bar];
        for (let s = 0; s < 16; s += 2) {
          steps[offset + s].bass = bNote;
        }
      }

      // High-energy synth arpeggios
      const arps = [
        [57, 60, 64], // Am
        [60, 64, 67], // C
        [53, 57, 60], // F
        [55, 59, 62]  // G
      ];
      for (let bar = 0; bar < 4; bar++) {
        const offset = bar * 16;
        const chord = arps[bar];
        [0, 3, 6, 8, 11, 14].forEach((s, idx) => {
          steps[offset + s].arp = chord[idx % chord.length];
        });
      }

      return steps;
    })()
  }
};

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.currentTrackKey = 'none';
    this.isPlaying = false;
    
    this.tempo = 120;
    this.step = 0;
    this.nextStepTime = 0;
    this.timerId = null;
    this.initialized = false;
    this.onStateChange = null;
  }

  notifyState() {
    if (this.onStateChange) {
      this.onStateChange(this.isPlaying, this.currentTrackKey);
    }
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  ensureUnlocked() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMusicTrack(trackKey) {
    this.ensureUnlocked();
    this.currentTrackKey = trackKey;
    if (trackKey === 'none') {
      this.stopMusic();
    } else {
      this.startMusic(trackKey);
    }
  }

  stopMusic(notify = true) {
    this.isPlaying = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (notify) this.notifyState();
  }

  startMusic(trackKey) {
    this.stopMusic(false);
    const track = TRACKS[trackKey];
    if (!track) return;
    
    this.isPlaying = true;
    this.tempo = track.tempo;
    this.step = 0;
    this.nextStepTime = this.ctx ? this.ctx.currentTime : 0;
    
    this.timerId = setInterval(() => {
      if (!this.ctx || !this.isPlaying) return;
      while (this.nextStepTime < this.ctx.currentTime + 0.1) {
        this.scheduleStep(trackKey, this.step, this.nextStepTime);
        this.advanceStep();
      }
    }, 25);
    this.notifyState();
  }

  toggleMusic() {
    this.ensureUnlocked();
    if (this.isPlaying) {
      this.stopMusic();
    } else {
      if (this.currentTrackKey === 'none') {
        this.currentTrackKey = 'mario';
      }
      this.startMusic(this.currentTrackKey);
    }
  }

  advanceStep() {
    const secondsPerBeat = 60.0 / this.tempo;
    const secondsPerStep = secondsPerBeat / 4; // 16th notes
    this.nextStepTime += secondsPerStep;
    const track = TRACKS[this.currentTrackKey];
    if (track) {
      this.step = (this.step + 1) % track.steps.length;
    }
  }

  midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  playSynthNote(freq, type, startTime, duration, volume = 0.2) {
    if (!this.ctx || !freq) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.setValueAtTime(volume, startTime + duration * 0.7);
      gain.gain.linearRampToValueAtTime(0.0001, startTime + duration);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch (e) {
      // Catch possible scheduling exceptions in disconnected/suspended states
    }
  }

  // SFX
  playJumpSound() {
    this.ensureUnlocked();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.15);
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.15);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  playBounceSound() {
    this.ensureUnlocked();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(440, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.25);
      
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.25);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  playTileSound() {
    this.ensureUnlocked();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
      
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.04);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }

  playEraseSound() {
    this.ensureUnlocked();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.06);
      
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.06);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }

  playDeathSound() {
    this.ensureUnlocked();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);
      
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.35);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  playPortalSound() {
    this.ensureUnlocked();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
      
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.25);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  playWinSound() {
    this.ensureUnlocked();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [52, 56, 59, 64, 68, 71, 76];
    notes.forEach((midi, index) => {
      try {
        const time = now + index * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(this.midiToFreq(midi), time);
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.linearRampToValueAtTime(0.0001, time + 0.3);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(time);
        osc.stop(time + 0.3);
      } catch (e) {}
    });
  }

  scheduleStep(trackKey, stepIndex, time) {
    const track = TRACKS[trackKey];
    if (!track) return;
    const stepData = track.steps[stepIndex];
    if (!stepData) return;
    
    const secondsPerBeat = 60.0 / this.tempo;
    const stepDur = secondsPerBeat / 4;

    if (stepData.lead) {
      this.playSynthNote(this.midiToFreq(stepData.lead), 'square', time, stepDur * 1.5, 0.12);
    }
    if (stepData.bass) {
      this.playSynthNote(this.midiToFreq(stepData.bass), 'triangle', time, stepDur * 1.8, 0.22);
    }
    if (stepData.arp) {
      this.playSynthNote(this.midiToFreq(stepData.arp), 'sine', time, stepDur * 1.2, 0.1);
    }
  }
}

export const audio = new AudioEngine();
