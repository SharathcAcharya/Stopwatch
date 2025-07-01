// Audio System for Stopwatch PWA

import { storage } from './storage.js';

/**
 * Audio Manager Class
 * Handles sound effects, notifications, and audio feedback
 */
class AudioManager {
  constructor() {
    this.audioContext = null;
    this.sounds = {};
    this.enabled = true;
    this.volume = 0.7;
    this.soundPack = 'default';
    
    // Sound configurations
    this.soundConfigs = {
      default: {
        name: 'Default',
        sounds: {
          start: { frequency: 800, duration: 150, type: 'sine' },
          pause: { frequency: 600, duration: 200, type: 'sine' },
          stop: { frequency: 400, duration: 300, type: 'sine' },
          lap: { frequency: 1000, duration: 100, type: 'sine' },
          complete: { frequency: 1200, duration: 500, type: 'sine', pattern: [200, 100, 200] },
          warning: { frequency: 300, duration: 1000, type: 'sawtooth' },
          tick: { frequency: 2000, duration: 50, type: 'square' }
        }
      },
      beep: {
        name: 'Beep',
        sounds: {
          start: { frequency: 1000, duration: 200, type: 'square' },
          pause: { frequency: 500, duration: 300, type: 'square' },
          stop: { frequency: 250, duration: 400, type: 'square' },
          lap: { frequency: 1500, duration: 150, type: 'square' },
          complete: { frequency: 2000, duration: 600, type: 'square', pattern: [300, 100, 300] },
          warning: { frequency: 200, duration: 1200, type: 'triangle' },
          tick: { frequency: 3000, duration: 30, type: 'square' }
        }
      },
      musical: {
        name: 'Musical',
        sounds: {
          start: { notes: ['C4'], duration: 200, type: 'sine' },
          pause: { notes: ['G3'], duration: 300, type: 'sine' },
          stop: { notes: ['F3'], duration: 400, type: 'sine' },
          lap: { notes: ['E4'], duration: 150, type: 'sine' },
          complete: { notes: ['C4', 'E4', 'G4'], duration: 600, type: 'sine' },
          warning: { notes: ['F#3'], duration: 1200, type: 'triangle' },
          tick: { notes: ['C6'], duration: 50, type: 'sine' }
        }
      },
      minimal: {
        name: 'Minimal',
        sounds: {
          start: { frequency: 440, duration: 100, type: 'sine', volume: 0.3 },
          pause: { frequency: 330, duration: 150, type: 'sine', volume: 0.3 },
          stop: { frequency: 220, duration: 200, type: 'sine', volume: 0.3 },
          lap: { frequency: 550, duration: 80, type: 'sine', volume: 0.3 },
          complete: { frequency: 660, duration: 300, type: 'sine', volume: 0.3 },
          warning: { frequency: 165, duration: 800, type: 'sine', volume: 0.3 },
          tick: { frequency: 880, duration: 20, type: 'sine', volume: 0.2 }
        }
      }
    };
    
    this.noteFrequencies = {
      'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56,
      'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00,
      'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
      'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
      'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
      'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
      'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25,
      'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99,
      'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
      'C6': 1046.50
    };
    
    this.init();
  }

  /**
   * Initialize audio manager
   */
  async init() {
    // Load settings
    this.enabled = storage.getSetting('soundEnabled', true);
    this.volume = storage.getSetting('soundVolume', 0.7);
    this.soundPack = storage.getSetting('soundPack', 'default');
    
    // Initialize audio context on user interaction
    this.setupAudioContext();
  }

  /**
   * Setup Web Audio API context
   */
  async setupAudioContext() {
    try {
      // Create audio context (will be suspended until user interaction)
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Setup audio worklet if available for better performance
      if (this.audioContext.audioWorklet) {
        // Audio worklet setup would go here for advanced audio processing
      }
      
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
      this.audioContext = null;
    }
  }

  /**
   * Resume audio context (required for user interaction)
   */
  async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn('Failed to resume audio context:', error);
      }
    }
  }

  /**
   * Play sound by name
   * @param {string} soundName - Name of sound to play
   * @param {Object} options - Sound options
   */
  async playSound(soundName, options = {}) {
    if (!this.enabled || !this.audioContext) {
      return;
    }

    await this.resumeAudioContext();

    const soundConfig = this.getSoundConfig(soundName);
    if (!soundConfig) {
      console.warn(`Sound "${soundName}" not found in pack "${this.soundPack}"`);
      return;
    }

    try {
      if (soundConfig.notes) {
        await this.playMusicalSound(soundConfig, options);
      } else {
        await this.playToneSound(soundConfig, options);
      }
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  }

  /**
   * Play tone-based sound
   * @param {Object} config - Sound configuration
   * @param {Object} options - Additional options
   */
  async playToneSound(config, options = {}) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Configure oscillator
    oscillator.type = config.type || 'sine';
    oscillator.frequency.setValueAtTime(
      config.frequency || 440,
      this.audioContext.currentTime
    );
    
    // Configure volume with envelope
    const volume = (config.volume || 1) * this.volume * (options.volume || 1);
    const duration = (config.duration || 200) / 1000;
    const currentTime = this.audioContext.currentTime;
    
    // Attack-Decay-Sustain-Release envelope
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.01); // Attack
    gainNode.gain.exponentialRampToValueAtTime(volume * 0.8, currentTime + duration * 0.3); // Decay
    gainNode.gain.setValueAtTime(volume * 0.8, currentTime + duration * 0.7); // Sustain
    gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + duration); // Release
    
    // Handle pattern for complex sounds
    if (config.pattern) {
      let time = currentTime;
      config.pattern.forEach((patternDuration, index) => {
        if (index % 2 === 0) {
          // Sound
          gainNode.gain.setValueAtTime(volume, time);
          gainNode.gain.exponentialRampToValueAtTime(0.001, time + patternDuration / 1000);
        }
        time += patternDuration / 1000;
      });
    }
    
    // Start and stop
    oscillator.start(currentTime);
    oscillator.stop(currentTime + duration);
  }

  /**
   * Play musical note-based sound
   * @param {Object} config - Sound configuration
   * @param {Object} options - Additional options
   */
  async playMusicalSound(config, options = {}) {
    const duration = (config.duration || 200) / 1000;
    const notes = config.notes || ['C4'];
    
    // Play each note
    for (let i = 0; i < notes.length; i++) {
      const frequency = this.noteFrequencies[notes[i]] || 440;
      const startTime = this.audioContext.currentTime + (i * duration / notes.length);
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.type = config.type || 'sine';
      oscillator.frequency.setValueAtTime(frequency, startTime);
      
      const volume = (config.volume || 1) * this.volume * (options.volume || 1);
      const noteDuration = duration / notes.length;
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + noteDuration);
    }
  }

  /**
   * Get sound configuration
   * @param {string} soundName - Sound name
   * @returns {Object|null} Sound configuration
   */
  getSoundConfig(soundName) {
    const pack = this.soundConfigs[this.soundPack];
    return pack ? pack.sounds[soundName] : null;
  }

  /**
   * Enable/disable audio
   * @param {boolean} enabled - Audio enabled state
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    storage.setSetting('soundEnabled', enabled);
  }

  /**
   * Set audio volume
   * @param {number} volume - Volume level (0-1)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    storage.setSetting('soundVolume', this.volume);
  }

  /**
   * Set sound pack
   * @param {string} packName - Sound pack name
   */
  setSoundPack(packName) {
    if (this.soundConfigs[packName]) {
      this.soundPack = packName;
      storage.setSetting('soundPack', packName);
      return true;
    }
    return false;
  }

  /**
   * Get available sound packs
   * @returns {Array} Available sound packs
   */
  getAvailableSoundPacks() {
    return Object.keys(this.soundConfigs).map(key => ({
      id: key,
      name: this.soundConfigs[key].name
    }));
  }

  /**
   * Test sound
   * @param {string} soundName - Sound to test
   */
  testSound(soundName) {
    this.playSound(soundName, { volume: 0.5 });
  }

  /**
   * Play notification sound
   * @param {string} type - Notification type
   */
  playNotification(type = 'complete') {
    this.playSound(type);
  }

  /**
   * Play tick sound for active timer
   */
  playTick() {
    if (storage.getSetting('tickSoundEnabled', false)) {
      this.playSound('tick', { volume: 0.3 });
    }
  }

  /**
   * Create custom sound pack
   * @param {string} name - Pack name
   * @param {Object} sounds - Sound configurations
   */
  createCustomSoundPack(name, sounds) {
    this.soundConfigs[name] = {
      name: name,
      type: 'custom',
      sounds: sounds
    };
    
    // Save to storage
    const customPacks = storage.getSetting('customSoundPacks', {});
    customPacks[name] = this.soundConfigs[name];
    storage.setSetting('customSoundPacks', customPacks);
  }

  /**
   * Load custom sound packs
   */
  loadCustomSoundPacks() {
    const customPacks = storage.getSetting('customSoundPacks', {});
    Object.assign(this.soundConfigs, customPacks);
  }

  /**
   * Export sound pack
   * @param {string} packName - Pack to export
   * @returns {Object|null} Pack data
   */
  exportSoundPack(packName) {
    const pack = this.soundConfigs[packName];
    if (!pack) {
      return null;
    }

    return {
      name: packName,
      pack: { ...pack },
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  /**
   * Import sound pack
   * @param {Object} packData - Pack data to import
   * @returns {boolean} Success status
   */
  importSoundPack(packData) {
    try {
      if (!packData.name || !packData.pack) {
        throw new Error('Invalid sound pack format');
      }

      this.createCustomSoundPack(packData.name, packData.pack.sounds);
      return true;
    } catch (error) {
      console.error('Failed to import sound pack:', error);
      return false;
    }
  }

  /**
   * Get audio context state
   * @returns {string} Audio context state
   */
  getAudioState() {
    return this.audioContext ? this.audioContext.state : 'unavailable';
  }

  /**
   * Check if audio is supported
   * @returns {boolean} Audio support status
   */
  isAudioSupported() {
    return !!(window.AudioContext || window.webkitAudioContext);
  }

  /**
   * Initialize audio on user interaction
   */
  async initializeOnUserInteraction() {
    if (!this.audioContext) {
      await this.setupAudioContext();
    }
    await this.resumeAudioContext();
  }

  /**
   * Cleanup audio resources
   */
  cleanup() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Create and export singleton instance
export const audioManager = new AudioManager();
export default AudioManager;