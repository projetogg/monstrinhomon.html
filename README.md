# Monstrinhomon - Therapeutic Game MVP

## 🎮 Overview
Monstrinhomon is a therapeutic game designed for children with ASD level 1 and ADHD, used in clinical settings. Therapists operate it on an iPad via GitHub Pages.

## ✨ Features

### Core Game Mechanics
- **15 Unique Monsters** across 4 elemental classes (Fire 🔥, Water 💧, Plant 🌿, Electric ⚡)
- **Class Type System** with advantage/weakness cycle
- **d20 Combat System** with level-moderated damage
- **Capture Mechanics** with probability-based outcomes
- **XP & Leveling** system (levels 1-100)
- **Monster Teams** (max 6 per player) and Box storage

### Therapeutic Components
- **Customizable Objectives** with weighted scoring (1-3 points)
- **Merit Points (PM)** system for tracking progress
- **Medal Awards** - Bronze (10 PM), Silver (25 PM), Gold (50 PM)
- **Session Tracking** with detailed reports
- **Turn-Based Gameplay** for fair participation

### User Interface
- **7 Main Tabs**: Home, Session, Players, Encounter, Therapy, Report, Settings
- **iPad Optimized** with touch-friendly buttons (min 44x44px)
- **Child-Friendly Design** with colorful gradients and emoji icons
- **Responsive Layout** works on all devices
- **Visual Progress Bars** for HP and XP

### Technical Features
- **Single HTML File** - Complete application, no dependencies
- **localStorage** - Auto-save on every change
- **Export/Import** - JSON backup and restore
- **Error Handling** - Global error catcher with visible diagnostics
- **Defensive Coding** - Null-safe with optional chaining throughout

## 🚀 Quick Start

### For Therapists
1. Open `index.html` in any modern web browser (Chrome, Safari, Firefox)
2. Add players via the "Players" tab
3. Create a session in the "Session" tab
4. Start encounters in the "Encounter" tab
5. Track therapeutic progress in the "Therapy" tab
6. View reports in the "Report" tab

### For Developers (AI-Friendly Setup)

#### Using Replit
1. Import this repository into Replit
2. The `.replit` file automatically configures everything
3. Click "Run" to start the development server
4. Access the game in the Webview panel

#### Using Command-Line Tools
```bash
# Interactive menu with all commands
npm run menu
# or
./commands.sh

# Quick commands
npm run dev        # Start local server
npm test           # Run tests
npm run validate   # Validate code
```

#### With AI Tools (ChatGPT, Claude, Copilot)
- **Read first**: `AI_SUMMARY.md` - Complete project summary for AI
- **Commands**: `AI_COMMANDS.md` - Ready-to-use prompts and scripts
- **Quick ref**: `QUICK_REFERENCE.md` - Fast copy-paste reference

### Deployment to GitHub Pages
1. Push `index.html` to your GitHub repository
2. Go to Settings → Pages
3. Select branch (main/master) and root directory
4. Save and access via `https://yourusername.github.io/repository-name/`

## 📱 Usage Guide

### Adding Players
1. Navigate to **Players** tab
2. Enter player name
3. Select class (Fire/Water/Plant/Electric)
4. Click "Add Player"
5. Each player automatically receives a level 5 starter monster

### Creating a Session
1. Navigate to **Session** tab
2. Enter session name (e.g., "Therapy Session 2024-01-15")
3. Click "Create Session"
4. Turn order is automatically generated

### Wild Encounters
1. Navigate to **Encounter** tab
2. Select "Wild Monster (Capture)"
3. Click "Start Encounter"
4. Actions available:
   - **Capture** - Try to catch the monster (probability shown)
   - **Attack** - Roll d20 for combat
   - **Flee** - Escape from encounter

### Tracking Therapy Progress
1. Navigate to **Therapy** tab
2. Add custom objectives with weight 1-3
3. During session, check off completed objectives per player
4. PM (Merit Points) automatically calculated
5. Medals awarded at thresholds

### Combat System
- **Dice Roll**: Enter your physical d20 roll (1-20)
- **Damage Formula**: Considers level difference, class advantages, and roll margin
- **Level Balancing**: High-level monsters deal minimal damage to low-level monsters
- **Class Advantages**: 
  - Fire > Plant > Water > Fire
  - Electric > Plant (weak to Fire)

## 🎯 Therapeutic Objectives

Default objectives included:
- Followed group rules (2 PM)
- Waited for turn patiently (3 PM)
- Helped another player (3 PM)
- Used calm voice throughout (2 PM)
- Made good eye contact (1 PM)
- Shared materials/ideas (2 PM)

Therapists can add custom objectives tailored to each session.

## 💾 Data Management

### Auto-Save
All changes are automatically saved to browser localStorage.

### Export Data
Settings → "Export All Data" downloads a JSON backup file.

### Import Data
Settings → "Import Data" restores from a JSON backup file.

### Clear Data
Settings → "Clear All Data" deletes everything (requires confirmation).

## 🛡️ Error Handling

- **Global Error Catcher**: All JavaScript errors are caught and displayed
- **Visible Error Panel**: Red banner at top shows errors with stack traces
- **Copy Error**: Button to copy error details for debugging
- **Defensive Coding**: All functions wrapped in try-catch blocks

## 🎨 Customization

### Game Configuration
Access via Settings → Therapist Mode:
- Max team size
- Max level
- Damage multiplier
- Capture base chance
- Medal tier thresholds
- Class advantages

## 📊 Reports

The Report tab shows:
- Session name and timestamps
- Player summaries with PM earned
- Medal awards
- Objectives completion rate
- Encounter history

## 🤖 AI Integration & Developer Tools

This project includes comprehensive AI-friendly documentation and tools:

### AI Documentation
- **AI_SUMMARY.md** - Complete project summary optimized for AI assistants (ChatGPT, Claude, etc)
- **AI_COMMANDS.md** - Ready-to-use prompts, commands, and workflows for AI-assisted development
- **QUICK_REFERENCE.md** - Fast copy-paste reference for common tasks

### Command-Line Tools
- **commands.sh** - Interactive menu with all development commands
  ```bash
  ./commands.sh  # or npm run menu
  ```
  Features:
  - Setup and installation
  - Development server
  - Testing and validation
  - Git operations
  - Project maintenance
  - Documentation access

### NPM Scripts
```bash
npm run dev        # Start development server (port 8000)
npm run menu       # Open interactive command menu
npm test           # Run all tests
npm run validate   # Validate code before commit
npm run backup     # Create project backup
npm run clean      # Clean temporary files
```

### Replit Configuration
- **.replit** - Automatic configuration for Replit.com
  - Zero-config import and run
  - Integrated debugger
  - Auto-start development server

### Using with AI Tools

**ChatGPT / Claude:**
```
1. Share AI_SUMMARY.md with the AI
2. Use prompts from AI_COMMANDS.md
3. Get code, explanations, and solutions
```

**GitHub Copilot:**
```
Reads AGENTS.md automatically
Use AI_SUMMARY.md as additional context
```

**Replit AI:**
```
Import repository
.replit configures everything
Ask Replit AI for help
```

## 🔧 Technical Details

- **File Size**: ~57KB
- **Lines of Code**: 1,359
- **Functions**: 36
- **No Dependencies**: Pure vanilla JavaScript
- **Browser Compatibility**: Modern browsers (Chrome 90+, Safari 14+, Firefox 88+)
- **Mobile Support**: Fully responsive, optimized for iPad

## 📝 License

Created for therapeutic use in clinical settings.

## 🤝 Support

For issues or questions, consult the error panel or check browser console for details.

---

**Note**: This is an MVP (Minimum Viable Product). Future enhancements can include:
- Trainer battles
- Boss battles  
- Narrative events
- Item system
- Multiple encounter types
- Advanced reporting
- Player-vs-player mode
