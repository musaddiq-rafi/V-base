
import { Cell } from "./types";
import { FormulaInterpreter } from "./interpreter";

export function evaluateRecursive(
    cellId: string,
    spreadsheet: ReadonlyMap<string, Cell>,
    visited: Set<string> = new Set()
): string {
    // 1. Cycle Detection
    if (visited.has(cellId)) {
        return "#REF!"; // Circular dependency
    }
    visited.add(cellId);

    const cell = spreadsheet.get(cellId);
    if (!cell) return ""; // Empty cell

    const data = cell; // In ReadonlyMap from useStorage, this is the plain object already

    // 2. If not a formula, return direct value
    if (!data.formula) {
        return data.value;
    }

    // 3. Evaluate Formula
    const getValue = (row: number, col: number) => {
        const targetId = `${row},${col}`;
        const val = evaluateRecursive(targetId, spreadsheet, new Set(visited));
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
    };

    try {
        const interpreter = new FormulaInterpreter(data.formula, getValue);
        const result = interpreter.evaluate();
        return isNaN(result) ? "#ERROR" : String(result);
    } catch (e) {
        return "#ERROR";
    }
}
