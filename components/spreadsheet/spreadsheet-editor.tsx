"use client";

import { useMutation, useStorage } from "@liveblocks/react/suspense";
import { Grid } from "./grid";
import { Toolbar } from "./toolbar";
import { SpreadsheetHeader } from "./spreadsheet-header";
import { FormulaBar } from "./formula-bar";
import { StatusBar } from "./status-bar";
import { CellPos } from "./types";
import { useState, useCallback, useMemo } from "react";
import { LiveObject } from "@liveblocks/client";
import { Id } from "@/convex/_generated/dataModel";
import { evaluateFormula, getColLabel } from "./utils";

interface SpreadsheetEditorProps {
    spreadsheetId: Id<"spreadsheets">;
}

export function SpreadsheetEditor({ spreadsheetId }: SpreadsheetEditorProps) {
    const [activeCell, setActiveCell] = useState<CellPos | null>(null);
    const [selectionRange, setSelectionRange] = useState<{ start: CellPos; end: CellPos } | null>(null);
    const [scale, setScale] = useState(1);

    // Formula editing state
    const [formulaBarValue, setFormulaBarValue] = useState("");
    const [isSelectingRange, setIsSelectingRange] = useState(false);

    const cells = useStorage((root) => root.spreadsheet);

    // Update cell style mutation
    const updateStyle = useMutation(({ storage }, style: any) => {
        if (!selectionRange) return;
        const spreadsheet = storage.get("spreadsheet");
        if (!spreadsheet) return;

        const startRow = Math.min(selectionRange.start.row, selectionRange.end.row);
        const endRow = Math.max(selectionRange.start.row, selectionRange.end.row);
        const startCol = Math.min(selectionRange.start.col, selectionRange.end.col);
        const endCol = Math.max(selectionRange.start.col, selectionRange.end.col);

        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                const cellId = `${r},${c}`;
                const currentCell = spreadsheet.get(cellId);

                if (currentCell) {
                    const currentData = currentCell.toObject();
                    const newStyle = { ...currentData.style, ...style };

                    // Toggle logic could go here, but for ranges we usually just apply
                    spreadsheet.set(cellId, new LiveObject({
                        ...currentData,
                        style: newStyle
                    }));
                } else {
                    // Create empty cell with style if it helps visibility, 
                    // though typically sheets don't persist empty cells just for style unless borders/fills.
                    // For MVP let's persist.
                    spreadsheet.set(cellId, new LiveObject({
                        value: "",
                        style: style
                    }));
                }
            }
        }
    }, [selectionRange]);

    // Handle Active Cell Change
    const handleActiveCellChange = useCallback((pos: CellPos | null) => {
        setActiveCell(pos);
        if (pos && cells) {
            const cellId = `${pos.row},${pos.col}`;
            const cell = cells.get(cellId);
            setFormulaBarValue(cell?.formula || cell?.value || "");
        } else {
            setFormulaBarValue("");
        }
    }, [cells]);

    // Handle Formula Bar Change
    const updateCell = useMutation(({ storage }, pos: CellPos, val: string) => {
        const spreadsheet = storage.get("spreadsheet");
        if (!spreadsheet) return;

        const cellId = `${pos.row},${pos.col}`;
        const isFormula = val.startsWith("=");
        const cellData = {
            value: isFormula ? "" : val,
            formula: isFormula ? val : undefined,
            style: spreadsheet.get(cellId)?.toObject().style,
        };

        if (val === "" && !cellData.style) {
            spreadsheet.delete(cellId);
        } else {
            spreadsheet.set(cellId, new LiveObject(cellData));
        }
    }, []);

    const handleFormulaBarChange = (val: string) => {
        setFormulaBarValue(val);
        if (activeCell) {
            updateCell(activeCell, val);

            // Detect if user starts typing formula that needs range selection
            if (val.startsWith("=") && val.endsWith("(")) {
                setIsSelectingRange(true);
            } else {
                // Heuristic: if we just typed a char that isn't related to range start, stop selecting
                // This is simplified. Proper state machine needed for robust interactions.
                // setIsSelectingRange(false);
            }
        }
    };

    // Derived active style for toolbar feedback (from active cell only)
    const activeStyle = activeCell && cells ? cells.get(`${activeCell.row},${activeCell.col}`)?.style : {};

    // Calculate Selection Stats
    const selectionStats = useMemo(() => {
        if (!selectionRange || !cells) return null;

        const startRow = Math.min(selectionRange.start.row, selectionRange.end.row);
        const endRow = Math.max(selectionRange.start.row, selectionRange.end.row);
        const startCol = Math.min(selectionRange.start.col, selectionRange.end.col);
        const endCol = Math.max(selectionRange.start.col, selectionRange.end.col);

        // Only show stats if more than 1 cell selected
        if (startRow === endRow && startCol === endCol) return null;

        const values: number[] = [];

        // Helper to get raw numeric value recursively or simply
        // For stats, we usually only count computed numeric values.
        // We'll simplisticly try to parse the cell's 'value' field. 
        // Note: Real sheets evaluate formulas first. 
        // Our 'value' field stores result for formulas? No, 'value' is empty for formulas in our current model. 
        // The display logic evaluates it. We need a way to get evaluated value here.
        // We can reuse evaluateFormula but we need the getter.

        const getCellValue = (r: number, c: number) => {
            const cId = `${r},${c}`;
            const cell = cells.get(cId);
            return cell?.value || "";
        };

        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                const cellId = `${r},${c}`;
                const cell = cells.get(cellId);
                if (cell) {
                    let val: string | number = cell.value;
                    if (cell.formula) {
                        val = evaluateFormula(cell.formula, getCellValue);
                    }

                    const num = parseFloat(String(val));
                    if (!isNaN(num) && String(val).trim() !== "") {
                        values.push(num);
                    }
                }
            }
        }

        if (values.length === 0) return null;

        return {
            count: values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            sum: values.reduce((a, b) => a + b, 0),
            avg: values.reduce((a, b) => a + b, 0) / values.length,
        };
    }, [selectionRange, cells]);

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden">
            <SpreadsheetHeader
                spreadsheetId={spreadsheetId}
                onUndo={() => { }} // Liveblocks undo history hook needed
                onRedo={() => { }}
                zoom={scale}
                onZoomChange={setScale}
            />

            <Toolbar
                onStyleChange={updateStyle}
                activeStyles={activeStyle}
            />

            <FormulaBar
                activeCell={activeCell}
                value={formulaBarValue}
                onChange={handleFormulaBarChange}
            />

            <div className="flex-1 overflow-hidden relative" style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
                <Grid
                    activeCell={activeCell}
                    selectionRange={selectionRange}
                    onSelectionChange={setSelectionRange}
                    onActiveCellChange={handleActiveCellChange}
                    isSelectingRange={isSelectingRange}
                    onRangeSelect={(rangeStr) => {
                        // Append range to current formula
                        setFormulaBarValue(prev => prev + rangeStr);
                        if (activeCell) {
                            updateCell(activeCell, formulaBarValue + rangeStr);
                        }
                        setIsSelectingRange(false);
                    }}
                />
            </div>

            <StatusBar selectionStats={selectionStats} />
        </div>
    );
}
