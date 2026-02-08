# SkillRespec ⚔️🎮

> **AI Agent Skill Optimizer** — Respec your skills like a game

Your AI agent has accumulated skills like an MMO character who hoarded every spell. Time for a respec.

## 🎯 What is this?

SkillRespec helps you:
- **Scan** your agent's skill tree
- **Analyze** skill health and redundancy
- **Respec** — get recommendations to trim, upgrade, or merge

Think of it as the talent tree reset for your AI agent.

## 📦 Installation

```bash
npm install -g skillrespec
```

Or run directly:
```bash
npx skillrespec scan ./skills
```

## 🚀 Usage

### Scan your skills
```bash
skillrespec scan [directory]
```

### Analyze skill health
```bash
skillrespec analyze [directory]
```

### Roast Mode 🔥
For when you need brutal honesty:
```bash
skillrespec analyze --roast
```

### Get respec recommendations
```bash
skillrespec respec
```

## 📊 Example Output

```
🔍 Scanning ./skills...
📦 Found 5 skill(s) in 23ms

  • prompt-guard v2.8.0
    AI prompt injection defense
  • web-scraper v1.2.0
    Extract data from websites
  • memory-manager v0.5.0
    Long-term memory management
```

## 🎮 Why "Respec"?

In RPGs, a **respec** lets you reallocate your skill points. Your agent needs the same thing:

- That `deprecated-api-v1` skill? Time to go.
- Three different "summarize" skills? Merge them.
- Core skills without proper SKILL.md? Fix them.

**Level up your agent. Respec your skills.** 🚀

## 🛣️ Roadmap

- [x] v0.1.0 — Basic scan & analyze
- [ ] v0.2.0 — Smart recommendations
- [ ] v0.3.0 — Auto-fix common issues
- [ ] v1.0.0 — Full skill optimization suite

## 📄 License

MIT © [seojoonkim](https://github.com/seojoonkim)

---

*Built with ☕ and the urge to clean up messy skill directories.*

**Star this repo if your agent needs a respec!** ⭐
