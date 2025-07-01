// Main Application - Advanced Stopwatch PWA

import { Stopwatch } from './stopwatch.js';
import { storage } from './storage.js';
import { themeManager } from './themes.js';
import { audioManager } from './audio.js';
import { 
  formatTime, 
  debounce, 
  vibrate, 
  showNotification,
  requestNotificationPermission,
  exportToJSON,
  exportToCSV,
  copyToClipboard,
  isMobile,
  supportsTouch
} from './utils.js';

/**
 * Main Application Class
 * Orchestrates all components and handles UI interactions
 */
class StopwatchApp {
  constructor() {
    this.stopwatch = new Stopwatch('stopwatch');
    this.currentMode = 'stopwatch';
    this.isFullscreen = false;
    this.keyboardEnabled = true;
    
    // UI elements
    this.elements = {};
    
    // Event handlers
    this.handlers = {
      keydown: this.handleKeydown.bind(this),
      visibilitychange: this.handleVisibilityChange.bind(this),
      beforeunload: this.handleBeforeUnload.bind(this)
    };
    
    // Touch/gesture support
    this.touchStartTime = 0;
    this.touchStartX = 0;
    this.touchStartY = 0;
    
    this.init();
  }

  /**
   * Initialize application
   */
  async init() {
    try {
      // Check PWA installation status
      this.checkPWAInstallation();
      
      // Initialize DOM elements
      this.initializeDOM();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Initialize components
      await this.initializeComponents();
      
      // Load saved state
      this.loadSavedState();
      
      // Setup PWA features
      this.setupPWAFeatures();
      
      // Initialize audio on first user interaction
      this.setupAudioInitialization();
      
      // Setup keyboard shortcuts
      this.setupKeyboardShortcuts();
      
      // Setup touch gestures
      this.setupTouchGestures();
      
      // Update UI
      this.updateUI();
      
      console.log('Stopwatch PWA initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.showError('Failed to initialize application');
    }
  }

  /**
   * Initialize DOM elements
   */
  initializeDOM() {
    // Get existing elements or create new ones
    this.elements = {
      timerDisplay: document.getElementById('display'),
      controls: document.querySelector('.controls'),
      lapList: document.getElementById('laps'),
      
      // These will be found or created in updateDocumentStructure
      modeSelector: null,
      themeSelector: null,
      settingsBtn: null,
      fullscreenBtn: null,
      exportBtn: null,
      
      // Modal elements (will be created)
      settingsModal: this.createElement('div', 'settings-modal'),
      exportModal: this.createElement('div', 'export-modal')
    };

    // Ensure core elements exist
    if (!this.elements.timerDisplay) {
      this.elements.timerDisplay = this.createElement('div', 'timer-display');
      this.elements.timerDisplay.id = 'display';
    }
    
    if (!this.elements.controls) {
      this.elements.controls = this.createElement('div', 'controls');
    }
    
    if (!this.elements.lapList) {
      this.elements.lapList = this.createElement('ul', 'lap-list');
      this.elements.lapList.id = 'laps';
    }

    // Setup timer display
    this.elements.timerDisplay.textContent = '00:00:00.00';
    this.elements.timerDisplay.classList.add('timer-display');
    
    // Update document structure (this will handle selectors and buttons)
    this.updateDocumentStructure();

    // Setup selectors after structure is ready
    this.setupModeSelector();
    this.setupThemeSelector();

    // Setup control buttons after structure is ready
    this.setupControlButtons();
    
    // Setup modals
    this.setupModals();
  }

  /**
   * Create DOM element with class
   * @param {string} tag - Element tag
   * @param {string} className - CSS class name
   * @returns {HTMLElement} Created element
   */
  createElement(tag, className) {
    const element = document.createElement(tag);
    if (className) {
      element.className = className;
    }
    return element;
  }

  /**
   * Setup mode selector
   */
  setupModeSelector() {
    if (!this.elements.modeSelector) return;
    
    // Clear existing options if any
    this.elements.modeSelector.innerHTML = '';
    
    const modes = [
      { value: 'stopwatch', label: 'Stopwatch' },
      { value: 'countdown', label: 'Countdown' },
      { value: 'interval', label: 'Interval Timer' },
      { value: 'pomodoro', label: 'Pomodoro' }
    ];

    modes.forEach(mode => {
      const option = document.createElement('option');
      option.value = mode.value;
      option.textContent = mode.label;
      this.elements.modeSelector.appendChild(option);
    });

    this.elements.modeSelector.value = this.currentMode;
  }

  /**
   * Setup theme selector
   */
  setupThemeSelector() {
    if (!this.elements.themeSelector) return;
    
    // Clear existing options if any
    this.elements.themeSelector.innerHTML = '';
    
    const themes = themeManager.getAvailableThemes();
    
    Object.entries(themes).forEach(([key, theme]) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = theme.name;
      this.elements.themeSelector.appendChild(option);
    });

    this.elements.themeSelector.value = themeManager.getCurrentTheme();
  }

  /**
   * Setup control buttons
   */
  setupControlButtons() {
    // Find existing buttons or create new ones
    const buttonConfigs = [
      { id: 'start', text: 'Start', class: 'control-btn primary', action: 'start' },
      { id: 'pause', text: 'Pause', class: 'control-btn', action: 'pause' },
      { id: 'reset', text: 'Reset', class: 'control-btn', action: 'stop' },
      { id: 'lap', text: 'Lap', class: 'control-btn', action: 'lap' }
    ];

    buttonConfigs.forEach(config => {
      let button = document.getElementById(config.id);
      if (!button) {
        button = this.createElement('button', config.class);
        button.id = config.id;
        this.elements.controls.appendChild(button);
      }
      
      button.textContent = config.text;
      button.className = config.class;
      button.dataset.action = config.action;
      
      this.elements[config.id + 'Btn'] = button;
    });

    // Additional buttons
    this.elements.settingsBtn.innerHTML = '⚙️';
    this.elements.settingsBtn.title = 'Settings';
    this.elements.fullscreenBtn.innerHTML = '⛶';
    this.elements.fullscreenBtn.title = 'Fullscreen';
    this.elements.exportBtn.innerHTML = '📥';
    this.elements.exportBtn.title = 'Export Data';
  }

  /**
   * Setup modals
   */
  setupModals() {
    // Settings modal
    this.elements.settingsModal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Settings</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="setting-group">
            <label>
              <input type="checkbox" id="soundEnabled"> Enable Sound
            </label>
          </div>
          <div class="setting-group">
            <label>
              <input type="checkbox" id="vibrationEnabled"> Enable Vibration
            </label>
          </div>
          <div class="setting-group">
            <label>
              <input type="checkbox" id="notificationsEnabled"> Enable Notifications
            </label>
          </div>
          <div class="setting-group">
            <label>
              Volume: <input type="range" id="volumeSlider" min="0" max="1" step="0.1">
            </label>
          </div>
          <div class="setting-group">
            <label>
              Sound Pack: <select id="soundPackSelector"></select>
            </label>
          </div>
        </div>
      </div>
    `;

    // Export modal
    this.elements.exportModal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Export Data</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <button id="exportJSON" class="export-btn">Export as JSON</button>
          <button id="exportCSV" class="export-btn">Export as CSV</button>
          <button id="copyData" class="export-btn">Copy to Clipboard</button>
        </div>
      </div>
    `;

    // Hide modals initially
    this.elements.settingsModal.style.display = 'none';
    this.elements.exportModal.style.display = 'none';
    
    // Add to document
    document.body.appendChild(this.elements.settingsModal);
    document.body.appendChild(this.elements.exportModal);
  }

  /**
   * Update document structure for modern layout
   */
  updateDocumentStructure() {
    // Check if structure already exists (from HTML)
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
      // Structure already exists, just get element references
      this.elements.modeSelector = document.querySelector('.timer-mode-selector');
      this.elements.themeSelector = document.querySelector('.theme-selector');
      this.elements.settingsBtn = document.querySelector('.settings-btn');
      this.elements.fullscreenBtn = document.querySelector('.fullscreen-btn');
      this.elements.exportBtn = document.querySelector('.export-btn');
      
      // Show the stopwatch that was hidden by CSS
      const stopwatch = document.querySelector('.stopwatch');
      if (stopwatch) {
        stopwatch.style.display = 'flex';
      }
      
      return;
    }
    
    // If no structure exists, create it (legacy fallback)
    const newAppContainer = this.createElement('div', 'app-container');
    
    const header = this.createElement('header', 'app-header');
    header.innerHTML = `
      <h1 class="app-title">Advanced Stopwatch</h1>
      <div class="header-controls">
        <select class="timer-mode-selector"></select>
        <select class="theme-selector"></select>
        <button class="settings-btn">⚙️</button>
        <button class="fullscreen-btn">⛶</button>
        <button class="export-btn">📥</button>
      </div>
    `;
    
    const mainContent = this.createElement('main', 'main-content');
    const stopwatchContainer = document.querySelector('.stopwatch') || this.createElement('div', 'stopwatch');
    
    // Move existing content
    mainContent.appendChild(stopwatchContainer);
    
    newAppContainer.appendChild(header);
    newAppContainer.appendChild(mainContent);
    
    // Replace body content
    document.body.innerHTML = '';
    document.body.appendChild(newAppContainer);
    
    // Update element references
    this.elements.modeSelector = header.querySelector('.timer-mode-selector');
    this.elements.themeSelector = header.querySelector('.theme-selector');
    this.elements.settingsBtn = header.querySelector('.settings-btn');
    this.elements.fullscreenBtn = header.querySelector('.fullscreen-btn');
    this.elements.exportBtn = header.querySelector('.export-btn');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Control button events
    if (this.elements.controls) {
      this.elements.controls.addEventListener('click', this.handleControlClick.bind(this));
    }
    
    // Mode selector
    if (this.elements.modeSelector) {
      this.elements.modeSelector.addEventListener('change', this.handleModeChange.bind(this));
    }
    
    // Theme selector
    if (this.elements.themeSelector) {
      this.elements.themeSelector.addEventListener('change', this.handleThemeChange.bind(this));
    }
    
    // Settings button
    if (this.elements.settingsBtn) {
      this.elements.settingsBtn.addEventListener('click', () => this.showModal('settings'));
    }
    
    // Fullscreen button
    if (this.elements.fullscreenBtn) {
      this.elements.fullscreenBtn.addEventListener('click', this.toggleFullscreen.bind(this));
    }
    
    // Export button
    if (this.elements.exportBtn) {
      this.elements.exportBtn.addEventListener('click', () => this.showModal('export'));
    }
    
    // Modal events
    document.addEventListener('click', this.handleModalClick.bind(this));
    
    // Global events
    document.addEventListener('keydown', this.handlers.keydown);
    document.addEventListener('visibilitychange', this.handlers.visibilitychange);
    window.addEventListener('beforeunload', this.handlers.beforeunload);
    
    // Stopwatch events
    this.setupStopwatchEventListeners();
  }

  /**
   * Initialize components
   */
  async initializeComponents() {
    // Initialize theme manager (already done in constructor)
    
    // Initialize audio manager
    await audioManager.initializeOnUserInteraction();
    
    // Request notification permission if enabled
    if (storage.getSetting('notificationsEnabled', false)) {
      await requestNotificationPermission();
    }
  }

  /**
   * Load saved state
   */
  loadSavedState() {
    // Load theme
    const savedTheme = storage.getSetting('theme', 'dark');
    themeManager.setTheme(savedTheme);
    
    // Load audio settings
    audioManager.setEnabled(storage.getSetting('soundEnabled', true));
    audioManager.setVolume(storage.getSetting('soundVolume', 0.7));
    audioManager.setSoundPack(storage.getSetting('soundPack', 'default'));
    
    // Load timer mode
    this.currentMode = storage.getSetting('lastMode', 'stopwatch');
    this.switchMode(this.currentMode);
  }

  /**
   * Handle control button clicks
   * @param {Event} event - Click event
   */
  handleControlClick(event) {
    const button = event.target.closest('button');
    if (!button || !button.dataset.action) return;
    
    const action = button.dataset.action;
    
    switch (action) {
      case 'start':
        this.startTimer();
        break;
      case 'pause':
        this.pauseTimer();
        break;
      case 'stop':
        this.stopTimer();
        break;
      case 'lap':
        this.addLap();
        break;
    }
  }

  /**
   * Start timer
   */
  startTimer() {
    if (this.stopwatch.start()) {
      audioManager.playSound('start');
      vibrate(100);
      this.updateUI();
    }
  }

  /**
   * Pause timer
   */
  pauseTimer() {
    if (this.stopwatch.pause()) {
      audioManager.playSound('pause');
      vibrate([100, 50, 100]);
      this.updateUI();
    }
  }

  /**
   * Stop/Reset timer
   */
  stopTimer() {
    if (this.stopwatch.stop()) {
      audioManager.playSound('stop');
      vibrate(200);
      this.updateUI();
      this.clearLapList();
    }
  }

  /**
   * Add lap time
   */
  addLap() {
    const lap = this.stopwatch.addLap();
    if (lap) {
      audioManager.playSound('lap');
      vibrate(50);
      this.addLapToUI(lap);
    }
  }

  /**
   * Handle mode change
   * @param {Event} event - Change event
   */
  handleModeChange(event) {
    const newMode = event.target.value;
    this.switchMode(newMode);
  }

  /**
   * Switch timer mode
   * @param {string} mode - New mode
   */
  switchMode(mode) {
    if (mode === this.currentMode) return;
    
    // Stop current timer
    this.stopTimer();
    
    // Create new stopwatch instance
    this.stopwatch = new Stopwatch(mode);
    this.currentMode = mode;
    
    // Update UI
    this.setupStopwatchEventListeners();
    this.updateUI();
    
    // Save preference
    storage.setSetting('lastMode', mode);
  }

  /**
   * Setup stopwatch event listeners
   */
  setupStopwatchEventListeners() {
    this.stopwatch.addEventListener('update', this.handleStopwatchUpdate.bind(this));
    this.stopwatch.addEventListener('start', this.handleStopwatchStart.bind(this));
    this.stopwatch.addEventListener('pause', this.handleStopwatchPause.bind(this));
    this.stopwatch.addEventListener('stop', this.handleStopwatchStop.bind(this));
    this.stopwatch.addEventListener('lap', this.handleStopwatchLap.bind(this));
    this.stopwatch.addEventListener('complete', this.handleStopwatchComplete.bind(this));
  }

  /**
   * Handle stopwatch update
   * @param {CustomEvent} event - Update event
   */
  handleStopwatchUpdate(event) {
    const { formattedTime } = event.detail;
    this.elements.timerDisplay.textContent = formattedTime;
  }

  /**
   * Handle stopwatch start
   */
  handleStopwatchStart() {
    this.elements.timerDisplay.classList.add('running', 'animate-glow');
    document.querySelector('.stopwatch').classList.add('running');
  }

  /**
   * Handle stopwatch pause
   */
  handleStopwatchPause() {
    this.elements.timerDisplay.classList.remove('animate-glow');
    document.querySelector('.stopwatch').classList.remove('running');
  }

  /**
   * Handle stopwatch stop
   */
  handleStopwatchStop() {
    this.elements.timerDisplay.classList.remove('running', 'animate-glow');
    document.querySelector('.stopwatch').classList.remove('running');
  }

  /**
   * Handle stopwatch lap
   * @param {CustomEvent} event - Lap event
   */
  handleStopwatchLap(event) {
    const { lap } = event.detail;
    this.addLapToUI(lap);
  }

  /**
   * Handle stopwatch complete
   * @param {CustomEvent} event - Complete event
   */
  handleStopwatchComplete(event) {
    audioManager.playSound('complete');
    vibrate([200, 100, 200, 100, 200]);
    showNotification('Timer Complete!', {
      body: `Your ${event.detail.mode} session has finished.`,
      requireInteraction: true
    });
  }

  /**
   * Add lap to UI
   * @param {Object} lap - Lap data
   */
  addLapToUI(lap) {
    const lapItem = document.createElement('li');
    lapItem.className = 'lap-item animate-slide-in-up';
    lapItem.innerHTML = `
      <span class="lap-number">Lap ${lap.number}</span>
      <span class="lap-time">${lap.formattedTotal}</span>
      <span class="lap-split">${lap.formattedSplit}</span>
    `;
    
    this.elements.lapList.insertBefore(lapItem, this.elements.lapList.firstChild);
    
    // Limit displayed laps
    const lapItems = this.elements.lapList.querySelectorAll('.lap-item');
    if (lapItems.length > 20) {
      lapItems[lapItems.length - 1].remove();
    }
  }

  /**
   * Clear lap list
   */
  clearLapList() {
    this.elements.lapList.innerHTML = '';
  }

  /**
   * Update UI based on current state
   */
  updateUI() {
    const { state } = this.stopwatch;
    
    // Update button states
    this.elements.startBtn.disabled = state === 'running';
    this.elements.pauseBtn.disabled = state === 'stopped';
    this.elements.lapBtn.disabled = state !== 'running';
    
    // Update display
    if (state === 'stopped') {
      this.elements.timerDisplay.textContent = this.getDefaultTimeDisplay();
    }
    
    // Update mode selector
    this.elements.modeSelector.value = this.currentMode;
  }

  /**
   * Get default time display for current mode
   * @returns {string} Default time string
   */
  getDefaultTimeDisplay() {
    switch (this.currentMode) {
      case 'countdown':
        return formatTime(this.stopwatch.countdownDuration || 0);
      case 'interval':
      case 'pomodoro':
        const config = this.stopwatch.getConfig();
        return formatTime(config.workDuration || 0);
      default:
        return '00:00:00.00';
    }
  }

  /**
   * Handle keyboard shortcuts
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeydown(event) {
    if (!this.keyboardEnabled || event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }

    switch (event.code) {
      case 'Space':
        event.preventDefault();
        if (this.stopwatch.state === 'running') {
          this.pauseTimer();
        } else {
          this.startTimer();
        }
        break;
      
      case 'KeyR':
        event.preventDefault();
        this.stopTimer();
        break;
      
      case 'KeyL':
        event.preventDefault();
        this.addLap();
        break;
      
      case 'F11':
        event.preventDefault();
        this.toggleFullscreen();
        break;
      
      case 'Escape':
        if (this.isFullscreen) {
          this.exitFullscreen();
        }
        break;
    }
  }

  /**
   * Handle theme change
   * @param {Event} event - Change event
   */
  handleThemeChange(event) {
    const theme = event.target.value;
    themeManager.setTheme(theme);
  }

  /**
   * Toggle fullscreen mode
   */
  async toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        this.isFullscreen = true;
        this.elements.fullscreenBtn.innerHTML = '⛷';
      } else {
        await document.exitFullscreen();
        this.isFullscreen = false;
        this.elements.fullscreenBtn.innerHTML = '⛶';
      }
    } catch (error) {
      console.warn('Fullscreen not supported:', error);
    }
  }

  /**
   * Exit fullscreen mode
   */
  async exitFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      this.isFullscreen = false;
      this.elements.fullscreenBtn.innerHTML = '⛶';
    }
  }

  /**
   * Show modal
   * @param {string} modalType - Modal type
   */
  showModal(modalType) {
    const modal = this.elements[modalType + 'Modal'];
    if (modal) {
      modal.style.display = 'flex';
      this.setupModalContent(modalType);
    }
  }

  /**
   * Hide modal
   * @param {string} modalType - Modal type
   */
  hideModal(modalType) {
    const modal = this.elements[modalType + 'Modal'];
    if (modal) {
      modal.style.display = 'none';
    }
  }

  /**
   * Setup modal content
   * @param {string} modalType - Modal type
   */
  setupModalContent(modalType) {
    if (modalType === 'settings') {
      this.setupSettingsModal();
    } else if (modalType === 'export') {
      this.setupExportModal();
    }
  }

  /**
   * Setup settings modal content
   */
  setupSettingsModal() {
    const modal = this.elements.settingsModal;
    
    // Load current settings
    modal.querySelector('#soundEnabled').checked = audioManager.enabled;
    modal.querySelector('#vibrationEnabled').checked = storage.getSetting('vibrationEnabled', true);
    modal.querySelector('#notificationsEnabled').checked = storage.getSetting('notificationsEnabled', false);
    modal.querySelector('#volumeSlider').value = audioManager.volume;
    
    // Setup sound pack selector
    const packSelector = modal.querySelector('#soundPackSelector');
    packSelector.innerHTML = '';
    audioManager.getAvailableSoundPacks().forEach(pack => {
      const option = document.createElement('option');
      option.value = pack.id;
      option.textContent = pack.name;
      packSelector.appendChild(option);
    });
    packSelector.value = audioManager.soundPack;
    
    // Setup event listeners
    modal.querySelector('#soundEnabled').addEventListener('change', (e) => {
      audioManager.setEnabled(e.target.checked);
    });
    
    modal.querySelector('#volumeSlider').addEventListener('input', (e) => {
      audioManager.setVolume(parseFloat(e.target.value));
    });
    
    modal.querySelector('#soundPackSelector').addEventListener('change', (e) => {
      audioManager.setSoundPack(e.target.value);
    });
  }

  /**
   * Setup export modal content
   */
  setupExportModal() {
    const modal = this.elements.exportModal;
    
    modal.querySelector('#exportJSON').addEventListener('click', () => {
      const data = storage.exportData();
      exportToJSON(data, 'stopwatch-session');
      this.hideModal('export');
    });
    
    modal.querySelector('#exportCSV').addEventListener('click', () => {
      const sessions = storage.getSessions();
      exportToCSV(sessions, 'stopwatch-sessions');
      this.hideModal('export');
    });
    
    modal.querySelector('#copyData').addEventListener('click', async () => {
      const data = this.stopwatch.exportSession();
      const success = await copyToClipboard(JSON.stringify(data, null, 2));
      if (success) {
        alert('Data copied to clipboard!');
      } else {
        alert('Failed to copy data');
      }
      this.hideModal('export');
    });
  }

  /**
   * Handle modal clicks
   * @param {Event} event - Click event
   */
  handleModalClick(event) {
    // Close modal when clicking outside or on close button
    if (event.target.classList.contains('modal-close') || 
        event.target.classList.contains('settings-modal') || 
        event.target.classList.contains('export-modal')) {
      
      this.hideModal('settings');
      this.hideModal('export');
    }
  }

  /**
   * Setup PWA features
   */
  async setupPWAFeatures() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        
        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Show update notification
              this.showUpdateNotification();
            }
          });
        });
      } catch (error) {
        console.warn('Service Worker registration failed:', error);
      }
    }
    
    // Handle app installation
    this.setupAppInstallation();
  }

  /**
   * Setup app installation prompt
   */
  setupAppInstallation() {
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredPrompt = event;
      
      // Show install button or notification
      this.showInstallPrompt(deferredPrompt);
    });
    
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      deferredPrompt = null;
    });
  }

  /**
   * Show install prompt
   * @param {Event} deferredPrompt - Install prompt event
   */
  showInstallPrompt(deferredPrompt) {
    // Create install button
    const installBtn = document.createElement('button');
    installBtn.textContent = 'Install App';
    installBtn.className = 'install-btn';
    installBtn.addEventListener('click', async () => {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('Install prompt outcome:', outcome);
      installBtn.remove();
    });
    
    // Add to header
    const header = document.querySelector('.app-header');
    if (header) {
      header.appendChild(installBtn);
    }
  }

  /**
   * Show update notification
   */
  showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <span>A new version is available!</span>
      <button onclick="window.location.reload()">Update</button>
      <button onclick="this.parentElement.remove()">Later</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }

  /**
   * Check PWA installation status
   */
  checkPWAInstallation() {
    // Check if running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      document.body.classList.add('pwa-installed');
    }
  }

  /**
   * Setup audio initialization on user interaction
   */
  setupAudioInitialization() {
    const initAudio = async () => {
      await audioManager.initializeOnUserInteraction();
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
    
    document.addEventListener('click', initAudio);
    document.addEventListener('touchstart', initAudio);
    document.addEventListener('keydown', initAudio);
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    this.keyboardEnabled = storage.getSetting('keyboardShortcuts', true);
  }

  /**
   * Setup touch gestures
   */
  setupTouchGestures() {
    if (!supportsTouch()) return;
    
    const stopwatchElement = document.querySelector('.stopwatch');
    if (!stopwatchElement) return;
    
    stopwatchElement.addEventListener('touchstart', this.handleTouchStart.bind(this));
    stopwatchElement.addEventListener('touchend', this.handleTouchEnd.bind(this));
    stopwatchElement.addEventListener('touchmove', this.handleTouchMove.bind(this));
  }

  /**
   * Handle touch start
   * @param {TouchEvent} event - Touch event
   */
  handleTouchStart(event) {
    const touch = event.touches[0];
    this.touchStartTime = Date.now();
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  }

  /**
   * Handle touch end
   * @param {TouchEvent} event - Touch event
   */
  handleTouchEnd(event) {
    const touchDuration = Date.now() - this.touchStartTime;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Tap gesture
    if (touchDuration < 300 && distance < 10) {
      if (this.stopwatch.state === 'running') {
        this.pauseTimer();
      } else {
        this.startTimer();
      }
    }
    
    // Long press gesture
    if (touchDuration > 1000 && distance < 10) {
      this.stopTimer();
    }
    
    // Swipe gestures
    if (distance > 50) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          // Swipe right - add lap
          this.addLap();
        } else {
          // Swipe left - reset
          this.stopTimer();
        }
      }
    }
  }

  /**
   * Handle touch move
   * @param {TouchEvent} event - Touch event
   */
  handleTouchMove(event) {
    // Prevent scrolling during gestures
    event.preventDefault();
  }

  /**
   * Handle visibility change
   */
  handleVisibilityChange() {
    if (document.hidden) {
      // App became hidden
      if (this.stopwatch.state === 'running') {
        // Continue running in background
        storage.setSetting('backgroundMode', true);
      }
    } else {
      // App became visible
      storage.setSetting('backgroundMode', false);
    }
  }

  /**
   * Handle before unload
   * @param {BeforeUnloadEvent} event - Before unload event
   */
  handleBeforeUnload(event) {
    if (this.stopwatch.state === 'running') {
      const message = 'Timer is still running. Are you sure you want to leave?';
      event.returnValue = message;
      return message;
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4444;
      color: white;
      padding: 15px;
      border-radius: 5px;
      z-index: 10000;
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Remove event listeners
    document.removeEventListener('keydown', this.handlers.keydown);
    document.removeEventListener('visibilitychange', this.handlers.visibilitychange);
    window.removeEventListener('beforeunload', this.handlers.beforeunload);
    
    // Cleanup audio
    audioManager.cleanup();
    
    // Stop any running timers
    this.stopwatch.stop();
  }
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.stopwatchApp = new StopwatchApp();
  });
} else {
  window.stopwatchApp = new StopwatchApp();
}

// Export for module usage
export default StopwatchApp;