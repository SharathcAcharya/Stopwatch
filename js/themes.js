// Theme Management System

import { storage } from './storage.js';

/**
 * Theme Manager Class
 * Handles theme switching, custom themes, and system preferences
 */
class ThemeManager {
  constructor() {
    this.currentTheme = 'dark';
    this.themes = {
      dark: {
        name: 'Dark',
        type: 'built-in',
        colors: {
          primary: '#000000',
          secondary: '#1a1a1a',
          tertiary: '#2a2a2a',
          accent: '#00ffff',
          text: '#ffffff',
          textSecondary: '#cccccc',
          border: '#333333'
        }
      },
      light: {
        name: 'Light',
        type: 'built-in',
        colors: {
          primary: '#ffffff',
          secondary: '#f8f9fa',
          tertiary: '#e9ecef',
          accent: '#007bff',
          text: '#212529',
          textSecondary: '#6c757d',
          border: '#dee2e6'
        }
      },
      neon: {
        name: 'Neon',
        type: 'built-in',
        colors: {
          primary: '#0a0a0a',
          secondary: '#1a0a1a',
          tertiary: '#2a1a2a',
          accent: '#ff00ff',
          text: '#ffffff',
          textSecondary: '#ff00ff',
          border: '#ff00ff'
        }
      },
      minimal: {
        name: 'Minimal',
        type: 'built-in',
        colors: {
          primary: '#fafafa',
          secondary: '#ffffff',
          tertiary: '#f5f5f5',
          accent: '#333333',
          text: '#333333',
          textSecondary: '#666666',
          border: '#e0e0e0'
        }
      },
      sport: {
        name: 'Sport',
        type: 'built-in',
        colors: {
          primary: '#003d00',
          secondary: '#005500',
          tertiary: '#007700',
          accent: '#00ff00',
          text: '#ffffff',
          textSecondary: '#ccffcc',
          border: '#00aa00'
        }
      }
    };
    
    this.customThemes = {};
    this.observers = [];
    
    this.init();
  }

  /**
   * Initialize theme manager
   */
  init() {
    // Load saved theme preference
    this.currentTheme = storage.getSetting('theme', 'dark');
    
    // Load custom themes
    this.customThemes = storage.getThemes();
    
    // Detect system theme preference
    this.detectSystemTheme();
    
    // Listen for system theme changes
    this.setupSystemThemeListener();
    
    // Apply initial theme
    this.applyTheme(this.currentTheme);
  }

  /**
   * Detect system theme preference
   */
  detectSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.systemTheme = 'dark';
    } else {
      this.systemTheme = 'light';
    }
  }

  /**
   * Setup listener for system theme changes
   */
  setupSystemThemeListener() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        this.systemTheme = e.matches ? 'dark' : 'light';
        
        // If user has auto theme preference, switch theme
        if (storage.getSetting('followSystemTheme', false)) {
          this.setTheme(this.systemTheme);
        }
        
        this.notifyObservers('systemThemeChange', { theme: this.systemTheme });
      });
    }
  }

  /**
   * Get available themes
   * @returns {Object} All available themes
   */
  getAvailableThemes() {
    return {
      ...this.themes,
      ...this.customThemes
    };
  }

  /**
   * Get current theme
   * @returns {string} Current theme name
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Get theme data
   * @param {string} themeName - Theme name
   * @returns {Object|null} Theme data
   */
  getTheme(themeName) {
    return this.themes[themeName] || this.customThemes[themeName] || null;
  }

  /**
   * Set active theme
   * @param {string} themeName - Theme name to apply
   * @returns {boolean} Success status
   */
  setTheme(themeName) {
    const theme = this.getTheme(themeName);
    if (!theme) {
      console.warn(`Theme "${themeName}" not found`);
      return false;
    }

    this.currentTheme = themeName;
    this.applyTheme(themeName);
    
    // Save preference
    storage.setSetting('theme', themeName);
    
    // Notify observers
    this.notifyObservers('themeChange', { theme: themeName, themeData: theme });
    
    return true;
  }

  /**
   * Apply theme to DOM
   * @param {string} themeName - Theme name
   */
  applyTheme(themeName) {
    const theme = this.getTheme(themeName);
    if (!theme) {
      return;
    }

    // Set data attribute for CSS targeting
    document.documentElement.setAttribute('data-theme', themeName);
    
    // Apply CSS custom properties if theme has colors
    if (theme.colors) {
      const root = document.documentElement;
      Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--theme-${key}`, value);
      });
    }
    
    // Apply additional CSS properties if present
    if (theme.css) {
      this.applyCSSProperties(theme.css);
    }
    
    // Update meta theme-color for PWA
    this.updateMetaThemeColor(theme.colors?.primary || '#000000');
  }

  /**
   * Apply CSS properties to root element
   * @param {Object} cssProperties - CSS properties object
   */
  applyCSSProperties(cssProperties) {
    const root = document.documentElement;
    Object.entries(cssProperties).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }

  /**
   * Update meta theme-color for PWA
   * @param {string} color - Color value
   */
  updateMetaThemeColor(color) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = color;
  }

  /**
   * Create custom theme
   * @param {string} name - Theme name
   * @param {Object} themeData - Theme data
   * @returns {boolean} Success status
   */
  createCustomTheme(name, themeData) {
    if (this.themes[name]) {
      console.warn(`Cannot override built-in theme "${name}"`);
      return false;
    }

    const customTheme = {
      name: themeData.name || name,
      type: 'custom',
      created: Date.now(),
      ...themeData
    };

    this.customThemes[name] = customTheme;
    storage.saveTheme(name, customTheme);
    
    this.notifyObservers('themeCreated', { name, theme: customTheme });
    
    return true;
  }

  /**
   * Update custom theme
   * @param {string} name - Theme name
   * @param {Object} updates - Theme updates
   * @returns {boolean} Success status
   */
  updateCustomTheme(name, updates) {
    if (this.themes[name]) {
      console.warn(`Cannot update built-in theme "${name}"`);
      return false;
    }

    if (!this.customThemes[name]) {
      console.warn(`Custom theme "${name}" not found`);
      return false;
    }

    this.customThemes[name] = {
      ...this.customThemes[name],
      ...updates,
      updated: Date.now()
    };

    storage.saveTheme(name, this.customThemes[name]);
    
    // If this is the current theme, reapply it
    if (this.currentTheme === name) {
      this.applyTheme(name);
    }
    
    this.notifyObservers('themeUpdated', { name, theme: this.customThemes[name] });
    
    return true;
  }

  /**
   * Delete custom theme
   * @param {string} name - Theme name
   * @returns {boolean} Success status
   */
  deleteCustomTheme(name) {
    if (this.themes[name]) {
      console.warn(`Cannot delete built-in theme "${name}"`);
      return false;
    }

    if (!this.customThemes[name]) {
      console.warn(`Custom theme "${name}" not found`);
      return false;
    }

    delete this.customThemes[name];
    storage.deleteTheme(name);
    
    // If this was the current theme, switch to default
    if (this.currentTheme === name) {
      this.setTheme('dark');
    }
    
    this.notifyObservers('themeDeleted', { name });
    
    return true;
  }

  /**
   * Export theme
   * @param {string} name - Theme name
   * @returns {Object|null} Theme data for export
   */
  exportTheme(name) {
    const theme = this.getTheme(name);
    if (!theme) {
      return null;
    }

    return {
      name,
      theme: { ...theme },
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  /**
   * Import theme
   * @param {Object} themeData - Imported theme data
   * @returns {boolean} Success status
   */
  importTheme(themeData) {
    try {
      if (!themeData.name || !themeData.theme) {
        throw new Error('Invalid theme data format');
      }

      return this.createCustomTheme(themeData.name, themeData.theme);
    } catch (error) {
      console.error('Failed to import theme:', error);
      return false;
    }
  }

  /**
   * Get theme preview
   * @param {Object} themeData - Theme data
   * @returns {Object} Preview data
   */
  getThemePreview(themeData) {
    return {
      colors: themeData.colors || {},
      preview: this.generatePreviewCSS(themeData),
      contrast: this.calculateContrast(themeData.colors)
    };
  }

  /**
   * Generate preview CSS
   * @param {Object} themeData - Theme data
   * @returns {string} CSS string
   */
  generatePreviewCSS(themeData) {
    if (!themeData.colors) {
      return '';
    }

    const cssVars = Object.entries(themeData.colors)
      .map(([key, value]) => `--preview-${key}: ${value};`)
      .join(' ');

    return `:root { ${cssVars} }`;
  }

  /**
   * Calculate color contrast ratios
   * @param {Object} colors - Color object
   * @returns {Object} Contrast information
   */
  calculateContrast(colors) {
    if (!colors || !colors.text || !colors.primary) {
      return { ratio: 0, level: 'insufficient' };
    }

    // Simple contrast calculation (would need proper implementation)
    const ratio = this.getContrastRatio(colors.text, colors.primary);
    
    let level = 'insufficient';
    if (ratio >= 7) {
      level = 'AAA';
    } else if (ratio >= 4.5) {
      level = 'AA';
    } else if (ratio >= 3) {
      level = 'AA Large';
    }

    return { ratio, level };
  }

  /**
   * Get contrast ratio between two colors
   * @param {string} color1 - First color
   * @param {string} color2 - Second color
   * @returns {number} Contrast ratio
   */
  getContrastRatio(color1, color2) {
    // Simplified contrast calculation
    // In a real implementation, you'd convert colors to RGB and calculate properly
    const l1 = this.getLuminance(color1);
    const l2 = this.getLuminance(color2);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Get relative luminance of a color
   * @param {string} color - Color string
   * @returns {number} Luminance value
   */
  getLuminance(color) {
    // Simplified luminance calculation
    // This is a placeholder - proper implementation would handle various color formats
    if (color === '#ffffff' || color === 'white') return 1;
    if (color === '#000000' || color === 'black') return 0;
    return 0.5; // Default middle value
  }

  /**
   * Add theme observer
   * @param {Function} callback - Observer callback
   */
  addObserver(callback) {
    this.observers.push(callback);
  }

  /**
   * Remove theme observer
   * @param {Function} callback - Observer callback
   */
  removeObserver(callback) {
    this.observers = this.observers.filter(obs => obs !== callback);
  }

  /**
   * Notify all observers
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  notifyObservers(event, data) {
    this.observers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Theme observer error:', error);
      }
    });
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  /**
   * Set theme to follow system preference
   * @param {boolean} follow - Whether to follow system theme
   */
  setFollowSystemTheme(follow) {
    storage.setSetting('followSystemTheme', follow);
    
    if (follow) {
      this.setTheme(this.systemTheme);
    }
  }

  /**
   * Get system theme preference
   * @returns {string} System theme
   */
  getSystemTheme() {
    return this.systemTheme;
  }
}

// Create and export singleton instance
export const themeManager = new ThemeManager();
export default ThemeManager;