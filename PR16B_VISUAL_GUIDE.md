# PR16B - PartyDex UI Visual Guide (Safety-Reviewed)

## Overview
The PartyDex UI provides a read-only view of the shared monster collection for the entire party/group.

**Safety Adjustments**: Simplified rarity badges (solid colors, no gradients/animations) per review feedback.

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
- **Badges**: Rarity has solid background color + border (simplified per review)
  - No gradients or animations for maximum safety/reviewability
  - Can be enhanced in future PR16D if desired

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

## Rarity Badge Colors (Simplified)

**Solid colors with borders** (gradients and animations removed per safety review):

```
Comum      → Solid #95a5a6, border #7f8c8d
Incomum    → Solid #3498db, border #2980b9
Raro       → Solid #9b59b6, border #8e44ad
Místico    → Solid #e74c3c, border #c0392b
Lendário   → Solid #f39c12, border #e67e22
```

**Note**: Gradients and shimmer animation removed for simplicity and lower review risk. Can be added in future PR16D if desired.

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

**Data Source** (explicit per review):
- Primary: `Data.getMonstersMapSync()` (JSON-loaded, returns Map → converted to Array)
- Fallback: `MONSTER_CATALOG` (hardcoded, only if JSON not available)

## Re-rendering (Idempotent)

The UI automatically re-renders when:
- User switches to the PartyDex tab

**Idempotent Behavior**:
- Multiple calls are safe (DOM-only updates)
- No side effects or state mutations
- No render loops
- Future: Can hook into capture/egg/reward events
