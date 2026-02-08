# ⚔️ SkillRespec

> AI Agent Skill Optimizer - Respec your skills like a game 🎮

[![npm version](https://img.shields.io/npm/v/skillrespec.svg)](https://www.npmjs.com/package/skillrespec)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Like in your favorite RPG, sometimes your AI agent needs to **respec**. Too many overlapping skills? Token budget bloated? SkillRespec analyzes your skill portfolio and tells you what to keep, merge, or drop.

## 🚀 Features

### CLI Commands

```bash
# Scan skills in a directory
skillrespec scan ./skills

# Analyze with technical metrics
skillrespec analyze

# 🔥 ROAST MODE - Get brutally honest feedback
skillrespec analyze --roast

# Get respec recommendations
skillrespec respec

# Query the skill catalog
skillrespec catalog --category security
skillrespec catalog --search "email"
skillrespec catalog --stats

# Show top token consumers
skillrespec top -n 20

# Generate 3D visualization data
skillrespec viz -o viz-data.json
```

### Technical Metrics

- **Cosine Similarity** - Find duplicate/overlapping skills
- **Cluster Density** - How balanced is your skill distribution
- **Overlap Coefficient** - Redundancy percentage
- **Coverage Score** - Per-category coverage analysis
- **Uniqueness Index** - How diverse is your portfolio

### 3D Visualization

Premium WebGL visualization with:

- 🌌 Dark theme + neon glow effects
- ✨ Particle/star background
- 🎥 Smooth camera animations
- 🔗 Interactive connection lines
- 📊 Real-time metrics panel
- 🏷️ Category filtering
- 💡 Skill detail popups with recommendations

## 📦 Installation

```bash
# Global install
npm install -g skillrespec

# Or run directly
npx skillrespec analyze --roast
```

## 🖥️ Visualization

```bash
# Generate viz data
skillrespec viz

# Start the 3D viewer
cd viz && npm install && npm run dev
```

Open `http://localhost:5173` for the interactive 3D skill map.

## 📊 Example Output

```
╔══════════════════════════════════════════════════════════════╗
║  🔥🔥🔥 ROAST MODE: SKILL PORTFOLIO DESTRUCTION 🔥🔥🔥       ║
╚══════════════════════════════════════════════════════════════╝

  Overall Score: 🟡 83/100
  [█████████████████░░░]

  ┌─────────────────────────────────────────────────────────────┐
  │ TECHNICAL METRICS                                          │
  ├─────────────────────────────────────────────────────────────┤
  │ Cluster Density        │ 67.0% (balance)               │
  │ Overlap Coefficient    │ 52.0% (redundancy)          │
  │ Uniqueness Index       │ 100.0%                         │
  │ Total Tokens           │ ~149,151 tokens                  │
  └─────────────────────────────────────────────────────────────┘

  💀 ROAST VERDICT:
  🔥 You have 20 skills that basically do the same thing. Ever heard of DRY?
  🔥 I've seen smaller context windows in submarine portholes.

  💡 RESPEC RECOMMENDATIONS:
     🔀 docx: 83% similar to pptx
     🔀 slack: 70% similar to discord
```

## 🛠️ Tech Stack

**CLI:**
- TypeScript + tsup
- Commander.js

**Visualization:**
- React 18
- Three.js (react-three-fiber)
- @react-three/drei
- @react-three/postprocessing
- Vite

## 🎮 Why "Respec"?

In RPGs, **respec** means reallocating your skill points - dropping skills that no longer serve you and investing in what matters. Your AI agent deserves the same optimization.

## 📝 License

MIT © seojoonkim

---

Made with ⚔️ by [Zeon](https://github.com/seojoonkim)
