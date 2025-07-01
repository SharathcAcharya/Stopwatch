# Advanced Stopwatch PWA

A modern, feature-rich Progressive Web App (PWA) stopwatch with advanced timing capabilities, multiple themes, and professional features for athletes, professionals, and casual users.

![Stopwatch Interface](https://github.com/user-attachments/assets/2df9e698-fe45-4561-b414-5247646b65bd)

## ✨ Features

### 🕐 Advanced Timing
- **Millisecond Precision**: Accurate timing down to centiseconds (00:00:00.00)
- **Multiple Timer Modes**: Stopwatch, Countdown, Interval Timer, and Pomodoro
- **Split/Lap Times**: Advanced lap timing with split and total times
- **High-Performance Timing**: Uses `requestAnimationFrame` for smooth updates

### 🎨 Modern Interface
- **5 Built-in Themes**: Dark, Light, Neon, Minimal, and Sport
- **Custom Theme System**: Create and save your own color schemes
- **Responsive Design**: Perfect experience on desktop, tablet, and mobile
- **Smooth Animations**: CSS3 animations with reduced-motion support
- **Accessibility**: Full ARIA support and keyboard navigation

### 📱 Progressive Web App
- **Offline Functionality**: Works without internet connection
- **Install to Device**: Add to home screen on mobile and desktop
- **Background Operation**: Continues timing when app is minimized
- **Service Worker**: Smart caching for optimal performance

### 🔊 Audio & Feedback
- **Sound Effects**: Multiple sound packs (Default, Beep, Musical, Minimal)
- **Haptic Feedback**: Vibration support on mobile devices
- **Custom Sound Packs**: Create and import your own audio themes
- **Volume Control**: Adjustable volume levels

### ⌨️ Advanced Controls
- **Keyboard Shortcuts**: 
  - `Space` - Start/Pause
  - `R` - Reset
  - `L` - Record Lap
  - `F11` - Fullscreen
  - `Esc` - Exit Fullscreen
- **Touch Gestures**: Tap to start/pause, long press to reset, swipe for actions
- **Voice Commands**: Voice-activated controls (future feature)

### 💾 Data Management
- **Local Storage**: Automatic session saving and settings persistence
- **Export Options**: JSON and CSV export of timing data
- **Session History**: Track multiple timing sessions with statistics
- **Import/Export**: Backup and restore your data

### 📊 Statistics & Analytics
- **Lap Analysis**: Fastest, slowest, and average lap times
- **Session Tracking**: Total sessions, time, and performance metrics
- **Performance Graphs**: Visual representation of timing data
- **Progress Tracking**: Monitor improvement over time

## 🚀 Getting Started

### Installation

1. **Web Browser**: Visit the live application URL
2. **Install as PWA**: Click the install button when prompted
3. **Local Development**: Clone and serve the files

```bash
# Clone the repository
git clone https://github.com/SharathcAcharya/Stopwatch.git

# Navigate to the directory
cd Stopwatch

# Serve locally (Python 3)
python -m http.server 8000

# Or use Node.js
npx serve .

# Visit http://localhost:8000
```

### Browser Compatibility

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Progressive Enhancement**: Graceful degradation for older browsers
- **Mobile Support**: iOS Safari, Chrome Mobile, Samsung Internet

## 🎯 Usage

### Basic Operations

1. **Start Timer**: Click "Start" or press `Space`
2. **Pause Timer**: Click "Pause" or press `Space` while running
3. **Reset Timer**: Click "Reset" or press `R`
4. **Record Lap**: Click "Lap" or press `L` while running

### Timer Modes

#### Stopwatch Mode
- Traditional stopwatch functionality
- Unlimited timing duration
- Lap/split time recording

#### Countdown Mode
- Set a target duration
- Counts down to zero
- Notification when complete

#### Interval Timer
- Alternates between work and rest periods
- Configurable cycle count
- Automatic phase transitions

#### Pomodoro Timer
- 25-minute work periods
- 5-minute short breaks
- 15-minute long breaks every 4 cycles

### Touch Gestures (Mobile)

- **Single Tap**: Start/Pause timer
- **Long Press**: Reset timer
- **Swipe Right**: Record lap
- **Swipe Left**: Reset timer
- **Double Tap**: Switch to fullscreen

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Start/Pause |
| `R` | Reset |
| `L` | Lap |
| `F11` | Fullscreen |
| `Esc` | Exit Fullscreen |
| `?` | Show shortcuts help |

## ⚙️ Configuration

### Themes

Choose from built-in themes or create custom ones:

- **Dark**: Default dark theme with cyan accents
- **Light**: Clean light theme for bright environments
- **Neon**: Vibrant neon colors for high contrast
- **Minimal**: Subtle, distraction-free interface
- **Sport**: Green theme inspired by sports timing

### Audio Settings

- **Sound Packs**: Default, Beep, Musical, Minimal
- **Volume Control**: 0-100% volume adjustment
- **Enable/Disable**: Toggle all sound effects
- **Custom Sounds**: Import your own sound packs

### Display Options

- **Time Format**: Full (HH:MM:SS.CC), Short (MM:SS.CC), Minimal
- **Precision**: Centiseconds or milliseconds
- **Font Size**: Automatic responsive scaling
- **Animations**: Enable/disable for performance or preference

## 🔧 Technical Details

### Architecture

- **ES6+ JavaScript**: Modern JavaScript with classes and modules
- **CSS Custom Properties**: Dynamic theming system
- **Web APIs**: Audio, Vibration, Notification, Storage
- **Service Worker**: Offline functionality and caching
- **Performance**: `requestAnimationFrame` timing, debounced events

### File Structure

```
/
├── index.html              # Main HTML file
├── manifest.json           # PWA manifest
├── sw.js                  # Service worker
├── css/
│   ├── styles.css         # Main styles
│   ├── themes.css         # Theme system
│   └── animations.css     # Animation library
├── js/
│   ├── app.js            # Main application
│   ├── stopwatch.js      # Core timing logic
│   ├── storage.js        # Data persistence
│   ├── themes.js         # Theme management
│   ├── audio.js          # Sound system
│   └── utils.js          # Utility functions
├── assets/
│   ├── icons/            # PWA icons
│   ├── sounds/           # Audio files
│   └── images/           # UI assets
└── README.md
```

### Performance

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Setup

```bash
# Install development dependencies (optional)
npm install

# Run linting
npm run lint

# Run tests
npm test

# Build for production
npm run build
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Web Audio API for sound generation
- Service Worker API for offline functionality
- CSS Grid and Flexbox for responsive layouts
- Modern browser APIs for PWA features

## 🔮 Roadmap

- [ ] Voice commands integration
- [ ] Cloud synchronization
- [ ] Social sharing features
- [ ] Advanced analytics dashboard
- [ ] Workout timer presets
- [ ] Multi-language support
- [ ] Apple Watch companion app

## 📞 Support

For support, feature requests, or bug reports:

- Open an issue on GitHub
- Contact the development team
- Check the documentation wiki

---

**Made with ❤️ for timing perfection**