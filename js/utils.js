// Utility Functions for Stopwatch PWA

/**
 * Format time with millisecond precision
 * @param {number} milliseconds - Total milliseconds
 * @param {string} format - Format type: 'full', 'short', 'minimal'
 * @returns {string} Formatted time string
 */
export function formatTime(milliseconds, format = 'full') {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const ms = Math.floor((milliseconds % 1000) / 10); // Display centiseconds

  switch (format) {
    case 'minimal':
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    
    case 'short':
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    
    case 'full':
    default:
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }
}

/**
 * Parse time string to milliseconds
 * @param {string} timeString - Time string in format HH:MM:SS.CC
 * @returns {number} Total milliseconds
 */
export function parseTime(timeString) {
  const parts = timeString.split(':');
  if (parts.length !== 3) return 0;
  
  const hours = parseInt(parts[0]) || 0;
  const minutes = parseInt(parts[1]) || 0;
  const secondsParts = parts[2].split('.');
  const seconds = parseInt(secondsParts[0]) || 0;
  const centiseconds = parseInt(secondsParts[1]) || 0;
  
  return (hours * 3600 + minutes * 60 + seconds) * 1000 + centiseconds * 10;
}

/**
 * Debounce function to limit rapid function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Generate unique ID
 * @returns {string} Unique identifier
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Validate time input
 * @param {string} input - Time input string
 * @returns {boolean} Is valid time format
 */
export function isValidTimeFormat(input) {
  const timeRegex = /^([0-5]?[0-9]):([0-5]?[0-9]):([0-5]?[0-9])(?:\.([0-9]{1,2}))?$/;
  return timeRegex.test(input);
}

/**
 * Get current timestamp with high precision
 * @returns {number} High precision timestamp
 */
export function getHighPrecisionTime() {
  return performance.now() + performance.timeOrigin;
}

/**
 * Calculate lap statistics
 * @param {Array} laps - Array of lap times in milliseconds
 * @returns {Object} Statistics object
 */
export function calculateLapStats(laps) {
  if (laps.length === 0) {
    return {
      fastest: 0,
      slowest: 0,
      average: 0,
      total: 0,
      count: 0
    };
  }

  const total = laps.reduce((sum, lap) => sum + lap, 0);
  const fastest = Math.min(...laps);
  const slowest = Math.max(...laps);
  const average = total / laps.length;

  return {
    fastest,
    slowest,
    average,
    total,
    count: laps.length
  };
}

/**
 * Export data to JSON
 * @param {Object} data - Data to export
 * @param {string} filename - Export filename
 */
export function exportToJSON(data, filename = 'stopwatch-data') {
  const jsonData = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Export data to CSV
 * @param {Array} data - Array of data objects
 * @param {string} filename - Export filename
 */
export function exportToCSV(data, filename = 'stopwatch-data') {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => row[header]).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      return true;
    } catch (fallbackErr) {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

/**
 * Vibrate device if supported
 * @param {number|Array} pattern - Vibration pattern
 */
export function vibrate(pattern = 100) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

/**
 * Request notification permission
 * @returns {Promise<string>} Permission status
 */
export async function requestNotificationPermission() {
  if ('Notification' in window) {
    return await Notification.requestPermission();
  }
  return 'denied';
}

/**
 * Show notification
 * @param {string} title - Notification title
 * @param {Object} options - Notification options
 */
export function showNotification(title, options = {}) {
  if ('Notification' in window && Notification.permission === 'granted') {
    return new Notification(title, {
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      ...options
    });
  }
}

/**
 * Check if device is mobile
 * @returns {boolean} Is mobile device
 */
export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Check if device supports touch
 * @returns {boolean} Supports touch
 */
export function supportsTouch() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Get device pixel ratio
 * @returns {number} Device pixel ratio
 */
export function getDevicePixelRatio() {
  return window.devicePixelRatio || 1;
}

/**
 * Safely parse JSON
 * @param {string} jsonString - JSON string to parse
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} Parsed object or default value
 */
export function safeJSONParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Failed to parse JSON:', error);
    return defaultValue;
  }
}

/**
 * Format number with locale
 * @param {number} number - Number to format
 * @param {Object} options - Intl.NumberFormat options
 * @returns {string} Formatted number
 */
export function formatNumber(number, options = {}) {
  return new Intl.NumberFormat(navigator.language, options).format(number);
}

/**
 * Get preferred language
 * @returns {string} Language code
 */
export function getPreferredLanguage() {
  return navigator.language || navigator.languages[0] || 'en-US';
}