# 🚀 Getting Started with Monstrinhomon

> 5-minute guide to start developing with AI assistance

## ⚡ Super Quick Start

### Option 1: Replit (Easiest)
1. Go to [Replit](https://replit.com)
2. Click "Import from GitHub"
3. Paste: `https://github.com/projetogg/monstrinhomon.html`
4. Click "Import"
5. Click "Run"
6. Done! 🎉

### Option 2: Local Development
```bash
# Clone the repository
git clone https://github.com/projetogg/monstrinhomon.html.git
cd monstrinhomon.html

# Start the development server
npm run dev

# Open in browser
# Go to: http://localhost:8000
```

### Option 3: Direct Browser
```bash
# Just open index.html in any browser
# Works immediately, no server needed
```

## 🤖 Using with AI Tools

### ChatGPT / Claude

**Step 1:** Copy and paste this to start:
```
I'm working on the Monstrinhomon project. 

Please read the AI_SUMMARY.md file from the repository:
https://github.com/projetogg/monstrinhomon.html/blob/main/AI_SUMMARY.md

After reading it, help me [YOUR TASK HERE]
```

**Step 2:** For specific tasks, use prompts from `AI_COMMANDS.md`

### GitHub Copilot

**Already configured!** 
- Copilot reads `AGENTS.md` automatically
- Just start coding and Copilot will assist

### Replit AI

**Step 1:** Import the repository (see Option 1 above)

**Step 2:** Click on "AI" button in Replit

**Step 3:** Ask questions like:
- "Explain this code"
- "Add a feature to..."
- "Fix this bug"

## 📋 Essential Files for AI

When working with AI assistants, these files have all the context:

1. **AI_SUMMARY.md** ⭐ - Complete project overview
   - What the project is
   - How it works
   - Code structure
   - Game rules

2. **AI_COMMANDS.md** - Ready-to-use prompts
   - Copy-paste prompts for common tasks
   - Command-line examples
   - Troubleshooting guides

3. **QUICK_REFERENCE.md** - Fast lookup
   - Quick commands
   - Code examples
   - Common workflows

4. **GAME_RULES.md** - Official game rules
   - Combat system
   - Class advantages
   - Capture mechanics

## 🎯 Common Tasks

### Add a New Feature

**With AI:**
```
I want to add [FEATURE] to Monstrinhomon.

Requirements:
- Vanilla JavaScript (no frameworks)
- Follow rules in GAME_RULES.md
- Compatible with localStorage

Please provide the complete code.
```

**Without AI:**
1. Read `GAME_RULES.md` for rules
2. Check `js/storage.js` for state structure
3. Add code to `index.html`
4. Test in browser
5. Run `npm test`

### Fix a Bug

**With AI:**
```
I have a bug in Monstrinhomon:

Error: [PASTE ERROR FROM CONSOLE]

Context: [WHAT YOU WERE DOING]

How do I fix it?
```

**Without AI:**
1. Open browser console (F12)
2. Find the error
3. Search code for the error location
4. Fix and test

### Run Tests

```bash
npm test              # Run once
npm run test:watch    # Auto-reload
npm run test:coverage # With coverage
```

## 🛠️ Development Tools

### Interactive Menu
```bash
npm run menu
# or
./commands.sh
```

This opens a menu with all commands:
- Setup & Installation
- Development
- Testing
- Git operations
- Utilities

### Quick Commands
```bash
npm run dev       # Start server
npm test          # Run tests
npm run validate  # Check code
npm run backup    # Backup project
```

## 📚 Documentation Structure

```
Documentation for Users:
└── README.md - General overview

Documentation for AI:
├── AI_SUMMARY.md ⭐ - Complete project summary
├── AI_COMMANDS.md - Commands and prompts
├── QUICK_REFERENCE.md - Fast reference
└── GAME_RULES.md - Official rules

Documentation for Developers:
├── LEIA-ME.md - Development guide (Portuguese)
├── AGENTS.md - GitHub Copilot instructions
└── Technical docs (various .md files)
```

## 🎮 Game Structure

### Main Files
- `index.html` - The complete game (single file!)
- `css/main.css` - Styles
- `js/storage.js` - State management

### Data Files (CSV)
- `MONSTROS.csv` - Monster catalog
- `CLASSES.csv` - Character classes
- `ITENS.csv` - Items
- `HABILIDADES.csv` - Abilities

### How it Works
```javascript
// 1. State is stored in localStorage
state = {
  data: {
    players: [],     // Game players
    instances: [],   // Caught monsters
    sessions: []     // Game sessions
  }
}

// 2. Functions manage the state
createPlayer()
createMonster()
startBattle()

// 3. UI updates automatically
render()
```

## 💡 Tips for Success

### For AI-Assisted Development

1. **Always provide context**: "In Monstrinhomon project..."
2. **Reference documentation**: "Following AI_SUMMARY.md..."
3. **Be specific**: Include exact requirements
4. **Ask for explanations**: "Explain this code..."
5. **Test everything**: Don't trust AI blindly

### For Manual Development

1. **Test in browser**: F12 console is your friend
2. **Small commits**: Commit often
3. **Follow conventions**: Check existing code style
4. **Update docs**: Keep documentation current
5. **Read GAME_RULES.md**: Don't break game rules

## 🐛 Troubleshooting

### Game doesn't open
```javascript
// In browser console (F12):
localStorage.clear()
location.reload()
```

### Tests fail
```bash
npm run clean
npm install
npm test
```

### Git issues
```bash
git status
git pull
# Fix conflicts
git push
```

### Need help
1. Check error in browser console (F12)
2. Look in `AI_COMMANDS.md` for solutions
3. Ask AI with error details
4. Search in code: `./commands.sh` → option 19

## 🎓 Learning Path

### Day 1: Understand the Project
1. Read `AI_SUMMARY.md` (10 min)
2. Read `QUICK_REFERENCE.md` (5 min)
3. Open `index.html` in browser
4. Play with the game

### Day 2: Make a Small Change
1. Choose a simple task
2. Use AI to help implement
3. Test the change
4. Commit the code

### Day 3: Add a Feature
1. Read `GAME_RULES.md`
2. Plan the feature
3. Use prompts from `AI_COMMANDS.md`
4. Implement and test

## 📞 Resources

### Links
- **Repository**: https://github.com/projetogg/monstrinhomon.html
- **Issues**: Use GitHub Issues for bugs
- **Discussions**: Use GitHub Discussions for questions

### Documentation
- AI_SUMMARY.md - For AI tools
- AI_COMMANDS.md - Commands reference
- QUICK_REFERENCE.md - Quick lookup
- GAME_RULES.md - Official rules
- README.md - User guide

### Tools
- **Browser**: Chrome/Firefox/Safari
- **Editor**: VS Code (recommended)
- **AI**: ChatGPT, Claude, Copilot, Replit AI
- **Terminal**: Any bash terminal

## ✅ Checklist: First Contribution

- [ ] Clone or import repository
- [ ] Open in browser or Replit
- [ ] Read AI_SUMMARY.md
- [ ] Read QUICK_REFERENCE.md
- [ ] Make a small change
- [ ] Test in browser
- [ ] Run tests: `npm test`
- [ ] Commit: `git commit -m "description"`
- [ ] Push: `git push`
- [ ] 🎉 Done!

## 🎉 You're Ready!

You now have:
- ✅ Repository set up
- ✅ Documentation read
- ✅ AI tools ready
- ✅ Commands available
- ✅ Understanding of structure

**Next steps:**
1. Choose a task from GitHub Issues
2. Use AI assistance if needed
3. Make the change
4. Test and commit
5. Create a Pull Request

Good luck! 🚀

---

**File**: GETTING_STARTED.md  
**Version**: 1.0.0  
**Last Updated**: 2026-02-01

**Need help?** Check AI_COMMANDS.md or ask an AI assistant!
