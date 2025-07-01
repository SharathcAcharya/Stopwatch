// Modern Stopwatch Class with Advanced Features

import { formatTime, getHighPrecisionTime, calculateLapStats } from './utils.js';
import { storage } from './storage.js';

/**
 * Advanced Stopwatch Class
 * Supports multiple modes: stopwatch, countdown, interval, pomodoro
 */
export class Stopwatch extends EventTarget {
  constructor(mode = 'stopwatch') {
    super();
    
    this.mode = mode; // 'stopwatch', 'countdown', 'interval', 'pomodoro'
    this.state = 'stopped'; // 'stopped', 'running', 'paused'
    this.startTime = 0;
    this.elapsedTime = 0;
    this.pausedTime = 0;
    this.animationFrameId = null;
    this.intervalId = null;
    
    // Lap tracking
    this.laps = [];
    this.lastLapTime = 0;
    
    // Countdown specific
    this.countdownDuration = 0;
    this.countdownRemaining = 0;
    
    // Interval timer specific
    this.intervalConfig = {
      workDuration: 25 * 60 * 1000, // 25 minutes
      restDuration: 5 * 60 * 1000,  // 5 minutes
      cycles: 4,
      currentCycle: 0,
      isWorkPhase: true
    };
    
    // Pomodoro specific
    this.pomodoroConfig = {
      workDuration: 25 * 60 * 1000,
      shortBreak: 5 * 60 * 1000,
      longBreak: 15 * 60 * 1000,
      cyclesUntilLongBreak: 4,
      currentCycle: 0,
      isWorkPhase: true
    };
    
    // Settings
    this.precision = 10; // Update every 10ms for smooth display
    this.highPrecision = false;
    
    // Session tracking
    this.sessionId = null;
    this.sessionStartTime = null;
    
    this.bindEvents();
  }

  /**
   * Bind internal event handlers
   */
  bindEvents() {
    // Auto-save on state changes
    this.addEventListener('statechange', () => {
      if (storage.getSetting('autoSave', true)) {
        this.saveSession();
      }
    });

    // Handle visibility change for accurate timing
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'running') {
        this.handleVisibilityChange();
      }
    });
  }

  /**
   * Handle visibility change to maintain accurate timing
   */
  handleVisibilityChange() {
    if (this.state === 'running') {
      // Store current time when tab becomes hidden
      this.hiddenTime = getHighPrecisionTime();
    } else if (this.hiddenTime && this.state === 'running') {
      // Adjust elapsed time when tab becomes visible
      const hiddenDuration = getHighPrecisionTime() - this.hiddenTime;
      this.elapsedTime += hiddenDuration;
      this.hiddenTime = null;
    }
  }

  /**
   * Start the timer
   * @returns {boolean} Success status
   */
  start() {
    if (this.state === 'running') {
      return false;
    }

    const now = getHighPrecisionTime();
    
    if (this.state === 'stopped') {
      this.startTime = now;
      this.elapsedTime = 0;
      this.sessionStartTime = new Date();
      this.sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      
      // Initialize mode-specific values
      if (this.mode === 'countdown') {
        this.countdownRemaining = this.countdownDuration;
      }
    } else if (this.state === 'paused') {
      this.startTime = now - this.elapsedTime;
    }

    this.state = 'running';
    this.startUpdateLoop();
    
    this.dispatchEvent(new CustomEvent('start', {
      detail: { mode: this.mode, elapsedTime: this.elapsedTime }
    }));
    
    this.dispatchEvent(new CustomEvent('statechange', {
      detail: { state: this.state, mode: this.mode }
    }));

    return true;
  }

  /**
   * Pause the timer
   * @returns {boolean} Success status
   */
  pause() {
    if (this.state !== 'running') {
      return false;
    }

    this.state = 'paused';
    this.pausedTime = getHighPrecisionTime();
    this.stopUpdateLoop();
    
    this.dispatchEvent(new CustomEvent('pause', {
      detail: { mode: this.mode, elapsedTime: this.elapsedTime }
    }));
    
    this.dispatchEvent(new CustomEvent('statechange', {
      detail: { state: this.state, mode: this.mode }
    }));

    return true;
  }

  /**
   * Stop/Reset the timer
   * @returns {boolean} Success status
   */
  stop() {
    const wasRunning = this.state === 'running';
    
    this.state = 'stopped';
    this.elapsedTime = 0;
    this.pausedTime = 0;
    this.startTime = 0;
    this.lastLapTime = 0;
    this.laps = [];
    this.stopUpdateLoop();
    
    // Reset mode-specific values
    if (this.mode === 'countdown') {
      this.countdownRemaining = this.countdownDuration;
    } else if (this.mode === 'interval') {
      this.intervalConfig.currentCycle = 0;
      this.intervalConfig.isWorkPhase = true;
    } else if (this.mode === 'pomodoro') {
      this.pomodoroConfig.currentCycle = 0;
      this.pomodoroConfig.isWorkPhase = true;
    }
    
    if (wasRunning && this.sessionId) {
      this.finalizeSession();
    }

    this.dispatchEvent(new CustomEvent('stop', {
      detail: { mode: this.mode }
    }));
    
    this.dispatchEvent(new CustomEvent('statechange', {
      detail: { state: this.state, mode: this.mode }
    }));

    return true;
  }

  /**
   * Add a lap time
   * @returns {Object|null} Lap data or null if failed
   */
  addLap() {
    if (this.state !== 'running') {
      return null;
    }

    const currentTime = this.getCurrentTime();
    const splitTime = currentTime - this.lastLapTime;
    
    const lap = {
      number: this.laps.length + 1,
      totalTime: currentTime,
      splitTime: splitTime,
      timestamp: new Date(),
      formattedTotal: formatTime(currentTime),
      formattedSplit: formatTime(splitTime)
    };

    this.laps.push(lap);
    this.lastLapTime = currentTime;

    // Save lap to storage
    if (this.sessionId) {
      storage.addLap(this.sessionId, lap);
    }

    this.dispatchEvent(new CustomEvent('lap', {
      detail: { lap, laps: [...this.laps] }
    }));

    return lap;
  }

  /**
   * Get current elapsed time
   * @returns {number} Current time in milliseconds
   */
  getCurrentTime() {
    if (this.state === 'stopped') {
      return 0;
    }
    
    if (this.state === 'paused') {
      return this.elapsedTime;
    }
    
    // Running state
    const now = getHighPrecisionTime();
    return now - this.startTime;
  }

  /**
   * Get remaining time for countdown modes
   * @returns {number} Remaining time in milliseconds
   */
  getRemainingTime() {
    if (this.mode === 'countdown') {
      return Math.max(0, this.countdownDuration - this.getCurrentTime());
    }
    
    if (this.mode === 'interval' || this.mode === 'pomodoro') {
      const config = this.mode === 'interval' ? this.intervalConfig : this.pomodoroConfig;
      const phaseDuration = config.isWorkPhase ? config.workDuration : 
        (this.mode === 'pomodoro' && this.shouldUseLongBreak() ? config.longBreak : config.restDuration);
      
      const phaseElapsed = this.getCurrentTime() % phaseDuration;
      return phaseDuration - phaseElapsed;
    }
    
    return 0;
  }

  /**
   * Check if should use long break in pomodoro mode
   * @returns {boolean} Should use long break
   */
  shouldUseLongBreak() {
    return this.mode === 'pomodoro' && 
           !this.pomodoroConfig.isWorkPhase && 
           this.pomodoroConfig.currentCycle % this.pomodoroConfig.cyclesUntilLongBreak === 0;
  }

  /**
   * Set countdown duration
   * @param {number} duration - Duration in milliseconds
   */
  setCountdownDuration(duration) {
    if (this.state === 'stopped') {
      this.countdownDuration = duration;
      this.countdownRemaining = duration;
    }
  }

  /**
   * Configure interval timer
   * @param {Object} config - Interval configuration
   */
  configureInterval(config) {
    if (this.state === 'stopped') {
      this.intervalConfig = { ...this.intervalConfig, ...config };
    }
  }

  /**
   * Configure pomodoro timer
   * @param {Object} config - Pomodoro configuration
   */
  configurePomodoro(config) {
    if (this.state === 'stopped') {
      this.pomodoroConfig = { ...this.pomodoroConfig, ...config };
    }
  }

  /**
   * Start the update loop using requestAnimationFrame
   */
  startUpdateLoop() {
    const update = () => {
      if (this.state === 'running') {
        this.elapsedTime = this.getCurrentTime();
        
        // Check for mode-specific completion
        this.checkModeCompletion();
        
        // Dispatch update event
        this.dispatchEvent(new CustomEvent('update', {
          detail: {
            elapsedTime: this.elapsedTime,
            formattedTime: this.getFormattedTime(),
            mode: this.mode,
            state: this.state
          }
        }));
        
        this.animationFrameId = requestAnimationFrame(update);
      }
    };
    
    this.animationFrameId = requestAnimationFrame(update);
  }

  /**
   * Stop the update loop
   */
  stopUpdateLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Check for mode-specific completion conditions
   */
  checkModeCompletion() {
    if (this.mode === 'countdown') {
      const remaining = this.getRemainingTime();
      if (remaining <= 0) {
        this.handleCountdownComplete();
      }
    } else if (this.mode === 'interval' || this.mode === 'pomodoro') {
      this.checkPhaseCompletion();
    }
  }

  /**
   * Handle countdown completion
   */
  handleCountdownComplete() {
    this.stop();
    this.dispatchEvent(new CustomEvent('complete', {
      detail: { mode: 'countdown', totalTime: this.countdownDuration }
    }));
  }

  /**
   * Check phase completion for interval/pomodoro modes
   */
  checkPhaseCompletion() {
    const config = this.mode === 'interval' ? this.intervalConfig : this.pomodoroConfig;
    const phaseDuration = config.isWorkPhase ? config.workDuration : 
      (this.mode === 'pomodoro' && this.shouldUseLongBreak() ? config.longBreak : config.restDuration);
    
    const phaseElapsed = this.getCurrentTime() % phaseDuration;
    
    if (phaseElapsed >= phaseDuration) {
      this.handlePhaseComplete();
    }
  }

  /**
   * Handle phase completion for interval/pomodoro modes
   */
  handlePhaseComplete() {
    const config = this.mode === 'interval' ? this.intervalConfig : this.pomodoroConfig;
    
    config.isWorkPhase = !config.isWorkPhase;
    
    if (!config.isWorkPhase) {
      config.currentCycle++;
    }
    
    this.dispatchEvent(new CustomEvent('phasechange', {
      detail: {
        mode: this.mode,
        isWorkPhase: config.isWorkPhase,
        currentCycle: config.currentCycle,
        totalCycles: config.cycles || config.cyclesUntilLongBreak
      }
    }));
    
    // Check if all cycles are complete
    if (this.mode === 'interval' && config.currentCycle >= config.cycles) {
      this.stop();
      this.dispatchEvent(new CustomEvent('complete', {
        detail: { mode: 'interval', cycles: config.cycles }
      }));
    }
  }

  /**
   * Get formatted time string
   * @param {string} format - Format type
   * @returns {string} Formatted time
   */
  getFormattedTime(format = null) {
    if (!format) {
      format = storage.getSetting('timeFormat', 'full');
    }
    
    let timeToFormat = this.getCurrentTime();
    
    if (this.mode === 'countdown') {
      timeToFormat = this.getRemainingTime();
    }
    
    return formatTime(timeToFormat, format);
  }

  /**
   * Get lap statistics
   * @returns {Object} Lap statistics
   */
  getLapStats() {
    const splitTimes = this.laps.map(lap => lap.splitTime);
    return calculateLapStats(splitTimes);
  }

  /**
   * Save current session
   */
  saveSession() {
    if (!this.sessionId || this.state === 'stopped') {
      return;
    }

    const sessionData = {
      id: this.sessionId,
      mode: this.mode,
      state: this.state,
      startTime: this.sessionStartTime,
      duration: this.elapsedTime,
      laps: [...this.laps],
      config: this.getConfig()
    };

    storage.addSession(sessionData);
  }

  /**
   * Finalize session when stopping
   */
  finalizeSession() {
    if (!this.sessionId) {
      return;
    }

    const sessionData = {
      id: this.sessionId,
      mode: this.mode,
      state: 'completed',
      startTime: this.sessionStartTime,
      endTime: new Date(),
      duration: this.elapsedTime,
      laps: [...this.laps],
      lapStats: this.getLapStats(),
      config: this.getConfig()
    };

    storage.addSession(sessionData);
    this.sessionId = null;
    this.sessionStartTime = null;
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    switch (this.mode) {
      case 'countdown':
        return { duration: this.countdownDuration };
      case 'interval':
        return { ...this.intervalConfig };
      case 'pomodoro':
        return { ...this.pomodoroConfig };
      default:
        return {};
    }
  }

  /**
   * Export session data
   * @returns {Object} Session data
   */
  exportSession() {
    return {
      mode: this.mode,
      state: this.state,
      elapsedTime: this.elapsedTime,
      laps: [...this.laps],
      lapStats: this.getLapStats(),
      config: this.getConfig(),
      exportTime: new Date().toISOString()
    };
  }

  /**
   * Load session data
   * @param {Object} sessionData - Session data to load
   */
  loadSession(sessionData) {
    if (this.state !== 'stopped') {
      this.stop();
    }

    this.mode = sessionData.mode || 'stopwatch';
    this.elapsedTime = sessionData.elapsedTime || 0;
    this.laps = sessionData.laps || [];
    
    if (sessionData.config) {
      switch (this.mode) {
        case 'countdown':
          this.setCountdownDuration(sessionData.config.duration);
          break;
        case 'interval':
          this.configureInterval(sessionData.config);
          break;
        case 'pomodoro':
          this.configurePomodoro(sessionData.config);
          break;
      }
    }

    this.dispatchEvent(new CustomEvent('sessionload', {
      detail: { sessionData }
    }));
  }
}

export default Stopwatch;