# PR16B - PartyDex UI Visual Guide

## Overview
The PartyDex UI provides a read-only view of the shared monster collection for the entire party/group.

## UI Layout

### Header Section
```
📘 Monstrodex do Grupo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Capturados: │ │Próximo Marco│ │   Faltam:   │ │   Próxima   │ │  Dinheiro   │
│      3      │ │     10      │ │      7      │ │ Recompensa: │ │ do Grupo:   │
│             │ │             │ │             │ │+100 moedas  │ │   0 💰      │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘

Progresso para o próximo marco: 30%
[████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 30%
```

### Monster Cards Grid

The cards are displayed in a responsive grid, sorted by status (captured → seen → unknown).

#### 1. Captured Monster Card (Full Display)
```
┌──────────────────────┐
│                      │
│         🎵           │  ← Emoji
│                      │
│     Cantapau         │  ← Name
│                      │
│  ┌─────┐ ┌────────┐  │
│  │Comum│ │ Bardo  │  │  ← Rarity & Class badges
│  └─────┘ └────────┘  │
│                      │
│  HP:28  ATK:6  DEF:4 │  ← Mini stats
│                      │
└──────────────────────┘
```
- **Background**: White with purple border
- **Shows**: Full emoji, name, class, rarity (color-coded), base stats
- **Badges**: Rarity has gradient background (gray=comum, blue=incomum, purple=raro, red=místico, gold=lendário)

#### 2. Seen Monster Card (Silhouette)
```
┌──────────────────────┐
│                      │
│         👻           │  ← Silhouette (darkened emoji)
│                      │
│         ???          │  ← Hidden name
│                      │
└──────────────────────┘
```
- **Background**: Light gray gradient
- **Shows**: Silhouette (emoji with black filter + 70% opacity)
- **Name**: Hidden as "???"
- **No badges or stats**
- **Filter CSS**: `filter: brightness(0) contrast(0); opacity: 0.7;`

#### 3. Unknown Monster Card (Mystery)
```
┌──────────────────────┐
│                      │
│                      │
│         ❓           │  ← Mystery icon
│                      │
│         ???          │  ← Hidden name
│                      │
└──────────────────────┘
```
- **Background**: Gray gradient
- **Shows**: Large ❓ icon (60px)
- **Name**: "???"
- **No emoji, badges, or stats**

## Visual States Summary

| State     | Emoji    | Name      | Class | Rarity | Stats | Background |
|-----------|----------|-----------|-------|--------|-------|------------|
| Captured  | ✅ Full  | ✅ Shown  | ✅    | ✅     | ✅    | White      |
| Seen      | 🌑 Shadow| ❌ Hidden | ❌    | ❌     | ❌    | Gray       |
| Unknown   | ❓ Icon  | ❌ Hidden | ❌    | ❌     | ❌    | Dark Gray  |

## Progress Bar Behavior

The progress bar shows progress toward the next milestone:
- **0 captured**: 0% (empty bar)
- **1 captured**: 10% (1/10)
- **5 captured**: 50% (5/10)
- **9 captured**: 90% (9/10)
- **10 captured**: 0% (resets for next milestone 20)
- **15 captured**: 50% (15/20 → 5/10)
- **19 captured**: 90% (19/20 → 9/10)
- **20 captured**: 0% (resets for next milestone 30)

Formula: `progressPct = ((capturedCount % 10) / 10) * 100`

## Rarity Badge Colors

```
Comum      → Gray gradient     #95a5a6 → #7f8c8d
Incomum    → Blue gradient     #3498db → #2980b9
Raro       → Purple gradient   #9b59b6 → #8e44ad
Místico    → Red gradient      #e74c3c → #c0392b
Lendário   → Gold gradient     #f39c12 → #e67e22 (with shimmer animation)
```

## Responsive Behavior

- **Desktop**: Grid shows 5-6 cards per row (180px min width)
- **Tablet**: Grid shows 3-4 cards per row
- **Mobile**: Grid shows 2-3 cards per row (150px min width)
- **Hover effect**: Cards lift up slightly on hover

## Example Full View

With sample data (3 captured, 2 seen, 1 unknown):

```
Row 1: [Cantapau (captured)] [Pedrino (captured)] [Faíscari (captured)]
Row 2: [👻 Seen] [👻 Seen]
Row 3: [❓ Unknown]
```

Cards are always sorted: captured first, then seen, then unknown.
Within each group, cards are sorted by template ID alphabetically.

## Tab Integration

The PartyDex tab is accessed via:
1. Click "📘 Monstrodex" button in the header tabs
2. UI renders automatically when tab opens
3. Shows live data from GameState.partyDex
4. Read-only (no buttons that change state)

## Re-rendering

The UI automatically re-renders when:
- User switches to the PartyDex tab
- (Future) After capturing a monster
- (Future) After hatching an egg
- (Future) After receiving a monster reward
