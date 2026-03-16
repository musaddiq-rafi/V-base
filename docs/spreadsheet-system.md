# Spreadsheet Room System Documentation

A real-time collaborative spreadsheet implementation built on Liveblocks Storage for VBase.

---

## Overview

The spreadsheet room provides a Google Sheets-like collaborative experience where multiple users can simultaneously edit cells, apply formulas, and see each other's changes in real-time. Unlike traditional databases, spreadsheet data is stored entirely in Liveblocks Storage, providing instant synchronization without server round-trips.

### Key Features

- ✅ **Real-time collaboration** — Changes propagate instantly to all participants
- ✅ **Live cursor presence** — See other users' selected cells with colored highlights
- ✅ **Formula support** — SUM, AVERAGE, COUNT, MAX, MIN with cell/range references
- ✅ **Cell styling** — Bold, italic, underline, strikethrough, colors, alignment
- ✅ **Number formatting** — Currency, percent, number formats
- ✅ **Selection statistics** — Sum, average, min, max, count for selected ranges
- ✅ **Row/column operations** — Insert and delete rows/columns
- ✅ **Resizable columns** — Drag column borders to resize

---

## Architecture

### Data Layer Separation

| Data Type | Storage Location | Persistence |
|-----------|------------------|-------------|
| Cell values, formulas, styles | **Liveblocks Storage** (LiveMap) | Persisted per Liveblocks room |
| Column widths | **Liveblocks Storage** (LiveMap) | Persisted per Liveblocks room |
| User cell selections | **Liveblocks Presence** | Ephemeral (real-time only) |
| Spreadsheet metadata | **Convex** (`spreadsheets` table) | Persistent database |

### Component Hierarchy

```
SpreadsheetPage (app/workspace/[...]/spreadsheet/[spreadsheetId]/page.tsx)
└── RoomProvider (Liveblocks)
    └── SpreadsheetEditor
        ├── SpreadsheetHeader    — Title, menu bar, zoom, row/col actions
        ├── Toolbar              — Formatting buttons (bold, italic, colors, etc.)
        ├── FormulaBar           — Active cell indicator + formula input
        ├── Grid                 — Main spreadsheet grid (50 rows × 26 columns)
        │   ├── Column Headers   — A-Z labels with resize handles
        │   ├── Row Headers      — 1-50 labels with selection
        │   └── CellComponent    — Individual cell rendering & editing
        └── StatusBar            — Selection statistics (sum, avg, etc.)
```

---

## File Structure

```
components/spreadsheet/
├── spreadsheet-editor.tsx   — Main editor component, orchestrates all sub-components
├── spreadsheet-header.tsx   — Title bar with menu (File, Edit, Insert, View, etc.)
├── spreadsheet-list.tsx     — List view of spreadsheets in a room
├── spreadsheet-card.tsx     — Card component for spreadsheet items
├── create-spreadsheet-modal.tsx — Modal for creating new spreadsheets
├── toolbar.tsx              — Formatting toolbar (Bold, Italic, Colors, etc.)
├── formula-bar.tsx          — Cell address + formula input bar
├── grid.tsx                 — Main spreadsheet grid with cells and headers
├── cell.tsx                 — Individual cell component with edit mode
├── status-bar.tsx           — Bottom bar showing selection stats
├── types.ts                 — TypeScript type definitions
├── utils.ts                 — Helper functions (column labels, cell parsing)
├── engine.ts                — Formula evaluation engine entry point
├── interpreter.ts           — Recursive descent parser for formulas
└── tokenizer.ts             — Lexical tokenizer for formula parsing

convex/
├── spreadsheets.ts          — Convex mutations/queries for metadata
└── schema.ts                — Contains `spreadsheets` table definition

app/workspace/[workspaceId]/room/[roomId]/spreadsheet/[spreadsheetId]/
└── page.tsx                 — Route page with RoomProvider setup
```

---

## Type Definitions

### Cell Type (`types.ts`)

```typescript
export type CellId = string; // "row,col" format, e.g., "0,0" for A1

export type CellStyle = {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strike?: boolean;
    color?: string;          // Text color (hex)
    background?: string;     // Background color (hex)
    align?: "left" | "center" | "right";
    format?: "currency" | "percent" | "number";
};

export type Cell = {
    value: string;           // Raw value or computed result
    formula?: string;        // Formula string starting with "="
    style?: CellStyle;
};

export interface CellPos {
    row: number;             // 0-indexed row
    col: number;             // 0-indexed column (0 = A, 1 = B, etc.)
}
```

### Liveblocks Storage (`liveblocks.config.ts`)

```typescript
Storage: {
    spreadsheet?: LiveMap<string, LiveObject<Cell>>; // Key: "row,col"
    columnWidths?: LiveMap<string, number>;          // Key: "colIndex"
};
```

### Liveblocks Presence (`liveblocks.config.ts`)

```typescript
Presence: {
    cursor: { x: number; y: number } | null;
    selectedCell: { row: number; col: number } | null; // Spreadsheet active cell
};
```

The `selectedCell` presence is used to show other users' selected cells with colored highlights in real-time.

### Convex Schema (`convex/schema.ts`)

```typescript
spreadsheets: defineTable({
    roomId: v.id("rooms"),           // Parent spreadsheet room
    workspaceId: v.id("workspaces"), // Denormalized for queries
    name: v.string(),                // Spreadsheet display name
    createdBy: v.string(),           // Clerk User ID
    createdAt: v.number(),
    updatedAt: v.number(),
    lastEditedBy: v.optional(v.string()),
})
    .index("by_room", ["roomId"])
    .index("by_workspace", ["workspaceId"]),
```

---

## Liveblocks Room ID Pattern

```
spreadsheet:${spreadsheetId}
```

Example: `spreadsheet:k57abc123def456`

---

## Formula Engine

The formula engine is a recursive descent parser supporting basic arithmetic operations and spreadsheet functions.

### Supported Functions

| Function | Description | Example |
|----------|-------------|---------|
| `SUM` | Sum of values | `=SUM(A1:A10)` |
| `AVERAGE` | Average of values | `=AVERAGE(B1:B5)` |
| `COUNT` | Count of numeric values | `=COUNT(A1:C3)` |
| `MAX` | Maximum value | `=MAX(A1, B1, C1)` |
| `MIN` | Minimum value | `=MIN(A1:A10)` |

### Supported Operators

- `+` Addition
- `-` Subtraction
- `*` Multiplication
- `/` Division
- `()` Parentheses for grouping

### Cell References

- **Single cell**: `A1`, `B5`, `AA10`
- **Range**: `A1:B5`, `C1:C100`

### Tokenizer (`tokenizer.ts`)

Converts formula strings into tokens:

```typescript
type TokenType =
    | "NUMBER"     // 123, 45.67
    | "STRING"     // "text"
    | "CELL_REF"   // A1, B5
    | "RANGE_REF"  // A1:B5
    | "FUNCTION"   // SUM, AVERAGE
    | "LPAREN"     // (
    | "RPAREN"     // )
    | "COMMA"      // ,
    | "OPERATOR"   // +, -, *, /
    | "EOF";       // End of formula
```

### Interpreter (`interpreter.ts`)

Implements a recursive descent parser with proper operator precedence:

1. **Expression** — Handles `+` and `-`
2. **Term** — Handles `*` and `/`
3. **Factor** — Handles numbers, cell refs, functions, parentheses

### Evaluation Engine (`engine.ts`)

```typescript
function evaluateRecursive(
    cellId: string,
    spreadsheet: ReadonlyMap<string, Cell>,
    visited: Set<string> = new Set()
): string
```

Key features:
- **Cycle detection** — Returns `#REF!` for circular references
- **Recursive evaluation** — Formulas can reference other formulas
- **Error handling** — Returns `#ERROR` for invalid formulas

### Example Formula Flow

```
User types: =SUM(A1:A3) + B1
    ↓
Tokenizer → [FUNCTION:"SUM", LPAREN, RANGE_REF:"A1:A3", RPAREN, OPERATOR:"+", CELL_REF:"B1"]
    ↓
Interpreter → parseExpression() → parseTerm() → parseFactor() → parseFunction()
    ↓
Engine → evaluateRecursive() for each referenced cell
    ↓
Result → Numeric value or error string
```

---

## Core Components

### SpreadsheetEditor (`spreadsheet-editor.tsx`)

The main orchestrator component that:

- Manages active cell and selection state
- Provides Liveblocks mutations for cell updates
- Calculates selection statistics
- Handles row/column insertion/deletion

**Key Mutations:**

```typescript
// Update cell value or formula
const updateCell = useMutation(({ storage }, pos: CellPos, val: string) => {
    const spreadsheet = storage.get("spreadsheet");
    const isFormula = val.startsWith("=");
    
    spreadsheet.set(`${pos.row},${pos.col}`, new LiveObject({
        value: isFormula ? "" : val,
        formula: isFormula ? val : undefined,
        style: /* preserved */
    }));
}, []);

// Update cell styling
const updateStyle = useMutation(({ storage }, style: any) => {
    // Applies style to all cells in selection range
}, [selectionRange]);

// Insert/delete rows and columns
const insertRow = useMutation(/* ... */);
const deleteRow = useMutation(/* ... */);
const insertColumn = useMutation(/* ... */);
const deleteColumn = useMutation(/* ... */);
```

### Grid (`grid.tsx`)

Renders the main spreadsheet grid:

- **50 rows × 26 columns** (A-Z)
- Sticky column headers with resize handles
- Sticky row headers
- Selection highlighting
- Mouse drag selection

### Cell (`cell.tsx`)

Individual cell component features:

- Display mode (shows computed values)
- Edit mode (double-click to edit)
- Formula autocomplete suggestions
- Style application (bold, colors, etc.)

### Toolbar (`toolbar.tsx`)

Formatting controls:
- Bold, Italic, Underline, Strikethrough
- Text color picker
- Background color picker
- Text alignment (left, center, right)
- Number formats (currency, percent, number)

### FormulaBar (`formula-bar.tsx`)

- Shows active cell address (e.g., "A1")
- Input field for values/formulas
- Syncs with cell edit state

### StatusBar (`status-bar.tsx`)

Shows real-time statistics for selected range:
- **Count** — Number of numeric cells
- **Min** — Minimum value
- **Max** — Maximum value
- **Average** — Mean of values
- **Sum** — Total (highlighted in green)

---

## Row/Column Operations

### Insert Row

```typescript
const insertRow = useMutation(({ storage }, direction: "above" | "below") => {
    const targetRow = direction === "above" ? activeCell.row : activeCell.row + 1;
    
    // Collect all cells >= targetRow
    // Shift them down by 1 row
    // Delete old positions, write new positions
}, [activeCell]);
```

### Insert Column

Same pattern as insert row, but shifts columns right.

### Delete Row/Column

1. Find and delete all cells in target row/column
2. Shift remaining cells up/left to fill gap

> **Note:** These operations iterate all cells in the LiveMap, which can be expensive for large spreadsheets.

---

## Data Flow

### Creating a Spreadsheet

```
User clicks "Create Spreadsheet"
    ↓
CreateSpreadsheetModal → convex/spreadsheets.createSpreadsheet
    ↓
Convex inserts into `spreadsheets` table
    ↓
Auto-creates linked chat channel (type: "file", contextType: "spreadsheet")
    ↓
UI updates via Convex real-time subscription
```

### Opening a Spreadsheet

```
User clicks spreadsheet card
    ↓
Navigate to /workspace/[id]/room/[id]/spreadsheet/[spreadsheetId]
    ↓
RoomProvider connects to Liveblocks room "spreadsheet:${spreadsheetId}"
    ↓
Initial storage: { spreadsheet: LiveMap(), columnWidths: LiveMap() }
    ↓
SpreadsheetEditor renders with useStorage() hooks
```

### Editing a Cell

```
User double-clicks cell → enters edit mode
    ↓
User types "=SUM(A1:A5)"
    ↓
On Enter: updateCell mutation fires
    ↓
Liveblocks broadcasts change to all participants
    ↓
Grid re-renders with evaluateRecursive() for display value
```

### Deleting a Spreadsheet

```
User clicks delete → confirms
    ↓
convex/spreadsheets.deleteSpreadsheet
    ↓
1. Find linked chat channel (by_context index)
2. Delete all messages in channel
3. Delete all read receipts
4. Delete channel
5. Delete spreadsheet record
```

---

## Convex Backend API

### Mutations

| Function | Description |
|----------|-------------|
| `createSpreadsheet` | Create new spreadsheet + linked chat channel |
| `deleteSpreadsheet` | Delete spreadsheet with cascading cleanup |

### Queries

| Function | Description |
|----------|-------------|
| `getSpreadsheetsByRoom` | List all spreadsheets in a room with creator details |
| `getSpreadsheetById` | Get single spreadsheet metadata |

---

## Styling System

### Cell Style Properties

```typescript
interface CellStyle {
    bold?: boolean;        // font-weight: bold
    italic?: boolean;      // font-style: italic
    underline?: boolean;   // text-decoration: underline
    strike?: boolean;      // text-decoration: line-through
    color?: string;        // color (hex)
    background?: string;   // background-color (hex)
    align?: "left" | "center" | "right";
    format?: "currency" | "percent" | "number";
}
```

### Number Formatting

Uses `Intl.NumberFormat` for locale-aware formatting:

```typescript
// Currency
new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
// Result: $1,234.56

// Percent
new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 2 })
// Result: 12.34%

// Number
new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 })
// Result: 1,234.56
```

---

## Utility Functions (`utils.ts`)

### Column Label Conversion

```typescript
getColLabel(0)  → "A"
getColLabel(25) → "Z"
getColLabel(26) → "AA"

getColIndex("A")  → 0
getColIndex("AA") → 26
```

### Cell ID Parsing

```typescript
parseCellId("A1")   → { row: 0, col: 0 }
parseCellId("B5")   → { row: 4, col: 1 }
parseCellId("AA10") → { row: 9, col: 26 }
```

### Range Parsing

```typescript
parseRange("A1:B3") → ["0,0", "0,1", "1,0", "1,1", "2,0", "2,1"]
```

---

## Selection System

### Selection State

```typescript
const [activeCell, setActiveCell] = useState<CellPos | null>(null);
const [selectionRange, setSelectionRange] = useState<{
    start: CellPos;
    end: CellPos;
} | null>(null);
```

### Selection Modes

1. **Single cell** — Click a cell
2. **Range selection** — Click and drag
3. **Column selection** — Click column header (selects all rows in column)
4. **Row selection** — Click row header (selects all columns in row)

### Formula Range Selection

When typing a formula like `=SUM(`, the user can click cells to insert references:

```typescript
const [isSelectingRange, setIsSelectingRange] = useState(false);

// When user types "=SUM("
setIsSelectingRange(true);

// User clicks/drags cells
onRangeSelect={(rangeStr) => {
    setFormulaBarValue(prev => prev + rangeStr);
    setIsSelectingRange(false);
}};
```

---

## Known Limitations

### Current Constraints

1. **Grid size** — Fixed at 50 rows × 26 columns (A-Z)
2. **Formula functions** — Only 5 basic functions (SUM, AVERAGE, COUNT, MAX, MIN)
3. **No undo/redo** — Liveblocks history integration pending
4. **No cell merging** — Not implemented
5. **No freeze panes** — Headers scroll with content
6. **No import/export** — No Excel/CSV support
7. **No charts** — Data visualization not implemented

### Performance Considerations

- Row/column insertion iterates all cells (O(n) where n = cell count)
- Formula evaluation is recursive (potential stack overflow for deeply nested formulas)
- Large selections may cause slow statistics calculation

---

## Future Enhancements (Planned)

- 🔮 More formula functions (IF, VLOOKUP, etc.)
- 🔮 Undo/redo with Liveblocks history
- 🔮 Cell merging
- 🔮 Freeze rows/columns
- 🔮 Import/export CSV/Excel
- 🔮 Conditional formatting
- 🔮 Charts and visualizations
- 🔮 Cell comments/notes
- 🔮 Named ranges
- 🔮 Keyboard shortcuts

---

## Related Documentation

- [Chat System](./chat-system.md) — Context-aware chat integration
- [Document System](./document-system.md) — Similar collaboration patterns
- [Whiteboard System](./whiteboard-system.md) — Another Liveblocks-backed room type
