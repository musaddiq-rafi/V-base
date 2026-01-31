import { Cell } from "./types";

/**
 * Converts column index to letter (0 -> A, 1 -> B, ..., 26 -> AA)
 */
export function getColLabel(index: number): string {
    let label = "";
    let i = index;
    while (i >= 0) {
        label = String.fromCharCode(65 + (i % 26)) + label;
        i = Math.floor(i / 26) - 1;
    }
    return label;
}

/**
 * Converts column letter to index (A -> 0, B -> 1)
 */
export function getColIndex(label: string): number {
    let index = 0;
    for (let i = 0; i < label.length; i++) {
        index = index * 26 + label.charCodeAt(i) - 64;
    }
    return index - 1;
}

/**
 * Parses "A1" to { row: 0, col: 0 }
 */
export function parseCellId(cellId: string): { row: number; col: number } | null {
    const match = cellId.match(/^([A-Z]+)([0-9]+)$/);
    if (!match) return null;
    const colStr = match[1];
    const rowStr = match[2];
    return {
        col: getColIndex(colStr),
        row: parseInt(rowStr) - 1,
    };
}

/**
 * Parses a range "A1:B3" to array of cell IDs ["0,0", "0,1", "1,0", "1,1", "2,0", "2,1"]
 */
export function parseRange(rangeStr: string): string[] {
    const parts = rangeStr.split(":");
    if (parts.length !== 2) return [];

    const start = parseCellId(parts[0]);
    const end = parseCellId(parts[1]);

    if (!start || !end) return [];

    const cellIds: string[] = [];
    const startRow = Math.min(start.row, end.row);
    const endRow = Math.max(start.row, end.row);
    const startCol = Math.min(start.col, end.col);
    const endCol = Math.max(start.col, end.col);

    for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
            cellIds.push(`${r},${c}`);
        }
    }

    return cellIds;
}

/**
 * Evaluates a formula
 * Supports:
 * - Basic math: + - * /
 * - Functions: SUM, AVERAGE, COUNT, MAX, MIN
 * - Cell refs: A1, B2
 * - Ranges: A1:B2
 */
export function evaluateFormula(formula: string, getCellValue: (row: number, col: number) => string | number): string {
    if (!formula.startsWith("=")) return formula;

    let expression = formula.substring(1).toUpperCase();

    // Helper to get numeric value from cell
    const getVal = (r: number, c: number): number => {
        const val = getCellValue(r, c);
        const num = parseFloat(String(val));
        return isNaN(num) ? 0 : num;
    };

    try {
        // 1. Resolve Ranges (SUM(A1:B2) -> SUM(1, 2, 3, 4))
        // Note: This is a simplified implementation. Proper tokenizer needed for full robustness.
        // We regex replace "A1:Z9" patterns.
        expression = expression.replace(/([A-Z]+[0-9]+):([A-Z]+[0-9]+)/g, (match) => {
            const cells = parseRange(match);
            // We can't replace range with values directly because functions expect args.
            // But JS eval can't handle ranges.
            // Strategy: Replace ranges with array logic or comma separated list if inside a function?
            // Easier strategy for MVP: Pre-process functions that take ranges.
            return match; // Temp, handled in function procesing
        });

        // 2. Resolve Functions
        // We'll replace known functions with JS implementations
        // SUM(A1:B2) or SUM(A1, B2)

        const functions = ["SUM", "AVERAGE", "COUNT", "MAX", "MIN"];

        for (const func of functions) {
            // Regex to match FUNC(args)
            // Nested logic is complex, assuming simple non-nested for MVP
            const regex = new RegExp(`${func}\\(([^)]+)\\)`, "g");
            expression = expression.replace(regex, (_, args) => {
                // Args can be ranges or single cells
                const values: number[] = [];
                const parts = args.split(",");

                for (const part of parts) {
                    const trimmed = part.trim();
                    // Check if range
                    if (trimmed.includes(":")) {
                        const rangeCells = parseRange(trimmed);
                        for (const cid of rangeCells) {
                            const [r, c] = cid.split(",").map(Number);
                            values.push(getVal(r, c));
                        }
                    } else {
                        // Check if cell
                        const cellPos = parseCellId(trimmed);
                        if (cellPos) {
                            values.push(getVal(cellPos.row, cellPos.col));
                        } else {
                            // Literal number
                            const num = parseFloat(trimmed);
                            if (!isNaN(num)) values.push(num);
                        }
                    }
                }

                if (func === "SUM") return values.reduce((a, b) => a + b, 0).toString();
                if (func === "AVERAGE") return values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toString() : "0";
                if (func === "COUNT") return values.length.toString();
                if (func === "MAX") return values.length ? Math.max(...values).toString() : "0";
                if (func === "MIN") return values.length ? Math.min(...values).toString() : "0";
                return "0";
            });
        }

        // 3. Resolve Individual User Cell References (A1) that are not part of ranges (already handled or remaining)
        expression = expression.replace(/([A-Z]+[0-9]+)/g, (match) => {
            // Check if it looks like a cell ref
            const pos = parseCellId(match);
            if (pos) {
                return getVal(pos.row, pos.col).toString();
            }
            return match;
        });

        // 4. Evaluate Math
        // Security warning: eval is dangerous. In production, use a math expression parser library.
        // For this university project/MVP, we'll strip anything not math-related.
        const safeExpression = expression.replace(/[^0-9+\-*/().\s]/g, "");

        // eslint-disable-next-line no-eval
        return eval(safeExpression).toString();

    } catch (e) {
        return "#ERROR";
    }
}
