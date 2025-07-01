// Storage Management for Stopwatch PWA

import { safeJSONParse } from './utils.js';

/**
 * Storage Manager Class
 * Handles all localStorage operations with error handling and validation
 */
class StorageManager {
  constructor() {
    this.prefix = 'stopwatch-pwa-';
    this.keys = {
      SETTINGS: 'settings',
      SESSIONS: 'sessions',
      LAPS: 'laps',
      STATISTICS: 'statistics',
      THEMES: 'themes',
      TIMERS: 'timers'
    };
    
    // Initialize default settings
    this.defaultSettings = {
      theme: 'dark',
      soundEnabled: true,
      vibrationEnabled: true,
      notificationsEnabled: false,
      timeFormat: 'full',
      autoSave: true,
      keyboardShortcuts: true,
      precision: 'centiseconds',
      language: 'en',
      lastUsed: Date.now()
    };
    
    this.initializeStorage();
  }

  /**
   * Initialize storage with default values if not exists
   */
  initializeStorage() {
    try {
      if (!this.getSettings()) {
        this.saveSettings(this.defaultSettings);
      }
      
      if (!this.getSessions()) {
        this.saveSessions([]);
      }
      
      if (!this.getStatistics()) {
        this.saveStatistics({
          totalSessions: 0,
          totalTime: 0,
          averageSessionTime: 0,
          longestSession: 0,
          totalLaps: 0,
          createdAt: Date.now()
        });
      }
    } catch (error) {
      console.error('Failed to initialize storage:', error);
    }
  }

  /**
   * Get full key with prefix
   * @param {string} key - Storage key
   * @returns {string} Prefixed key
   */
  getKey(key) {
    return this.prefix + key;
  }

  /**
   * Check if localStorage is available
   * @returns {boolean} Storage availability
   */
  isStorageAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get item from localStorage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if not found
   * @returns {*} Retrieved value
   */
  getItem(key, defaultValue = null) {
    if (!this.isStorageAvailable()) {
      console.warn('localStorage not available');
      return defaultValue;
    }

    try {
      const item = localStorage.getItem(this.getKey(key));
      return item ? safeJSONParse(item, defaultValue) : defaultValue;
    } catch (error) {
      console.error(`Failed to get item ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Set item in localStorage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean} Success status
   */
  setItem(key, value) {
    if (!this.isStorageAvailable()) {
      console.warn('localStorage not available');
      return false;
    }

    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Failed to set item ${key}:`, error);
      return false;
    }
  }

  /**
   * Remove item from localStorage
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  removeItem(key) {
    if (!this.isStorageAvailable()) {
      return false;
    }

    try {
      localStorage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all storage data
   * @returns {boolean} Success status
   */
  clearAll() {
    if (!this.isStorageAvailable()) {
      return false;
    }

    try {
      Object.values(this.keys).forEach(key => {
        this.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  }

  // Settings Management
  getSettings() {
    return this.getItem(this.keys.SETTINGS, this.defaultSettings);
  }

  saveSettings(settings) {
    const currentSettings = this.getSettings();
    const updatedSettings = { ...currentSettings, ...settings, lastUsed: Date.now() };
    return this.setItem(this.keys.SETTINGS, updatedSettings);
  }

  getSetting(key, defaultValue = null) {
    const settings = this.getSettings();
    return settings[key] !== undefined ? settings[key] : defaultValue;
  }

  setSetting(key, value) {
    const settings = this.getSettings();
    settings[key] = value;
    return this.saveSettings(settings);
  }

  // Sessions Management
  getSessions() {
    return this.getItem(this.keys.SESSIONS, []);
  }

  saveSessions(sessions) {
    return this.setItem(this.keys.SESSIONS, sessions);
  }

  addSession(session) {
    const sessions = this.getSessions();
    const newSession = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      timestamp: Date.now(),
      ...session
    };
    
    sessions.unshift(newSession); // Add to beginning
    
    // Keep only last 100 sessions
    if (sessions.length > 100) {
      sessions.splice(100);
    }
    
    this.saveSessions(sessions);
    this.updateStatistics(newSession);
    return newSession;
  }

  getSession(id) {
    const sessions = this.getSessions();
    return sessions.find(session => session.id === id);
  }

  deleteSession(id) {
    const sessions = this.getSessions();
    const filteredSessions = sessions.filter(session => session.id !== id);
    return this.saveSessions(filteredSessions);
  }

  // Laps Management
  getLaps(sessionId) {
    const allLaps = this.getItem(this.keys.LAPS, {});
    return allLaps[sessionId] || [];
  }

  saveLaps(sessionId, laps) {
    const allLaps = this.getItem(this.keys.LAPS, {});
    allLaps[sessionId] = laps;
    return this.setItem(this.keys.LAPS, allLaps);
  }

  addLap(sessionId, lapData) {
    const laps = this.getLaps(sessionId);
    const newLap = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      timestamp: Date.now(),
      lapNumber: laps.length + 1,
      ...lapData
    };
    
    laps.push(newLap);
    this.saveLaps(sessionId, laps);
    return newLap;
  }

  // Statistics Management
  getStatistics() {
    return this.getItem(this.keys.STATISTICS, {
      totalSessions: 0,
      totalTime: 0,
      averageSessionTime: 0,
      longestSession: 0,
      totalLaps: 0,
      createdAt: Date.now()
    });
  }

  saveStatistics(stats) {
    return this.setItem(this.keys.STATISTICS, stats);
  }

  updateStatistics(session) {
    const stats = this.getStatistics();
    
    stats.totalSessions += 1;
    stats.totalTime += session.duration || 0;
    stats.averageSessionTime = stats.totalTime / stats.totalSessions;
    
    if (session.duration > stats.longestSession) {
      stats.longestSession = session.duration;
    }
    
    if (session.laps) {
      stats.totalLaps += session.laps.length;
    }
    
    stats.lastUpdated = Date.now();
    this.saveStatistics(stats);
  }

  // Theme Management
  getThemes() {
    return this.getItem(this.keys.THEMES, {});
  }

  saveTheme(name, theme) {
    const themes = this.getThemes();
    themes[name] = {
      ...theme,
      created: Date.now(),
      id: Date.now().toString(36)
    };
    return this.setItem(this.keys.THEMES, themes);
  }

  deleteTheme(name) {
    const themes = this.getThemes();
    delete themes[name];
    return this.setItem(this.keys.THEMES, themes);
  }

  // Timer Configurations Management
  getTimers() {
    return this.getItem(this.keys.TIMERS, {});
  }

  saveTimer(name, config) {
    const timers = this.getTimers();
    timers[name] = {
      ...config,
      created: Date.now(),
      id: Date.now().toString(36)
    };
    return this.setItem(this.keys.TIMERS, timers);
  }

  deleteTimer(name) {
    const timers = this.getTimers();
    delete timers[name];
    return this.setItem(this.keys.TIMERS, timers);
  }

  // Export/Import Functionality
  exportData() {
    const data = {
      settings: this.getSettings(),
      sessions: this.getSessions(),
      laps: this.getItem(this.keys.LAPS, {}),
      statistics: this.getStatistics(),
      themes: this.getThemes(),
      timers: this.getTimers(),
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    
    return data;
  }

  importData(data) {
    try {
      if (data.settings) {
        this.saveSettings(data.settings);
      }
      
      if (data.sessions) {
        this.saveSessions(data.sessions);
      }
      
      if (data.laps) {
        this.setItem(this.keys.LAPS, data.laps);
      }
      
      if (data.statistics) {
        this.saveStatistics(data.statistics);
      }
      
      if (data.themes) {
        this.setItem(this.keys.THEMES, data.themes);
      }
      
      if (data.timers) {
        this.setItem(this.keys.TIMERS, data.timers);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  // Storage Info
  getStorageInfo() {
    if (!this.isStorageAvailable()) {
      return { available: false };
    }

    try {
      let totalSize = 0;
      let itemCount = 0;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(this.prefix)) {
          const value = localStorage.getItem(key);
          totalSize += key.length + value.length;
          itemCount++;
        }
      }
      
      return {
        available: true,
        itemCount,
        totalSize,
        formattedSize: this.formatBytes(totalSize),
        quota: this.getStorageQuota()
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { available: false, error: error.message };
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async getStorageQuota() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          quota: estimate.quota,
          usage: estimate.usage,
          available: estimate.quota - estimate.usage,
          formattedQuota: this.formatBytes(estimate.quota),
          formattedUsage: this.formatBytes(estimate.usage),
          formattedAvailable: this.formatBytes(estimate.quota - estimate.usage)
        };
      } catch (error) {
        console.error('Failed to get storage quota:', error);
      }
    }
    return null;
  }
}

// Create and export singleton instance
export const storage = new StorageManager();
export default StorageManager;