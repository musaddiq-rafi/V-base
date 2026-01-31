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
    const columnWidths = useStorage((root) => root.columnWidths);

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

    // Insert Row Mutation
    const insertRow = useMutation(({ storage }, direction: "above" | "below") => {
        if (!activeCell) return;
        const spreadsheet = storage.get("spreadsheet");
        if (!spreadsheet) return;

        const targetRow = direction === "above" ? activeCell.row : activeCell.row + 1;

        // We need to shift everything >= targetRow down by 1
        // Since we can't query keys by range easily in LiveMap, we iterate all
        // This is expensive but necessary for this data model.
        // To avoid overwriting issues, we should process in descending order or collect moves.
        // LiveMap doesn't support complex queries, so we get all entries.

        // Collect moves: { from: "r,c", to: "r+1,c", data: ... }
        const moves: { from: string; to: string; data: any }[] = [];

        // We can't iterate LiveMap directly with standard methods easily without converting?
        // Storage.get("spreadsheet") is a LiveMap.
        // .entries() returns iterator.

        for (const [key, cell] of spreadsheet.entries()) {
            const [rStr, cStr] = key.split(",");
            const r = parseInt(rStr);
            const c = parseInt(cStr);

            if (r >= targetRow) {
                moves.push({
                    from: key,
                    to: `${r + 1},${c}`,
                    data: cell.toObject() // Clone data
                });
            }
        }

        // Sort moves descending by row to avoid conflicts? 
        // Actually since we clone data, we can just write active updates.
        // But we must delete old keys that moved.
        // A cell at targetRow moves to targetRow+1. targetRow becomes empty.

        // Apply updates
        // 1. Delete all moved keys to clear space (optional if we just overwrite, but let's be clean)
        // Wait, if 5 moves to 6, and 6 moves to 7...
        // We can just set new values. But we must be careful not to read Dirty state if we did it in-place.
        // collecting 'moves' (snapshot) first is safe.

        moves.forEach(move => {
            spreadsheet.delete(move.from);
        });

        moves.forEach(move => {
            spreadsheet.set(move.to, new LiveObject(move.data));
        });

    }, [activeCell]);

    // Insert Column Mutation
    const insertColumn = useMutation(({ storage }, direction: "left" | "right") => {
        if (!activeCell) return;
        const spreadsheet = storage.get("spreadsheet");
        if (!spreadsheet) return;

        const targetCol = direction === "left" ? activeCell.col : activeCell.col + 1;

        const moves: { from: string; to: string; data: any }[] = [];

        for (const [key, cell] of spreadsheet.entries()) {
            const [rStr, cStr] = key.split(",");
            const r = parseInt(rStr);
            const c = parseInt(cStr);

            if (c >= targetCol) {
                moves.push({
                    from: key,
                    to: `${r},${c + 1}`,
                    data: cell.toObject()
                });
            }
        }

        moves.forEach(move => {
            spreadsheet.delete(move.from);
        });

        moves.forEach(move => {
            spreadsheet.set(move.to, new LiveObject(move.data));
        });

    }, [activeCell]);

    // Delete Row Mutation
    const deleteRow = useMutation(({ storage }) => {
        if (!activeCell) return;
        const spreadsheet = storage.get("spreadsheet");
        if (!spreadsheet) return;

        const targetRow = activeCell.row;
        const moves: { from: string; to: string; data: any }[] = [];
        const toDelete: string[] = [];

        for (const [key, cell] of spreadsheet.entries()) {
            const [rStr, cStr] = key.split(",");
            const r = parseInt(rStr);
            const c = parseInt(cStr);

            if (r === targetRow) {
                toDelete.push(key);
            } else if (r > targetRow) {
                moves.push({
                    from: key,
                    to: `${r - 1},${c}`,
                    data: cell.toObject()
                });
            }
        }

        toDelete.forEach(key => spreadsheet.delete(key));
        moves.forEach(move => spreadsheet.delete(move.from));
        moves.forEach(move => spreadsheet.set(move.to, new LiveObject(move.data)));
    }, [activeCell]);

    // Delete Column Mutation
    const deleteColumn = useMutation(({ storage }) => {
        if (!activeCell) return;
        const spreadsheet = storage.get("spreadsheet");
        if (!spreadsheet) return;

        const targetCol = activeCell.col;
        const moves: { from: string; to: string; data: any }[] = [];
        const toDelete: string[] = [];

        for (const [key, cell] of spreadsheet.entries()) {
            const [rStr, cStr] = key.split(",");
            const r = parseInt(rStr);
            const c = parseInt(cStr);

            if (c === targetCol) {
                toDelete.push(key);
            } else if (c > targetCol) {
                moves.push({
                    from: key,
                    to: `${r},${c - 1}`,
                    data: cell.toObject()
                });
            }
        }

        toDelete.forEach(key => spreadsheet.delete(key));
        moves.forEach(move => spreadsheet.delete(move.from));
        moves.forEach(move => spreadsheet.set(move.to, new LiveObject(move.data)));
    }, [activeCell]);

    // Resize Column Mutation
    const resizeColumn = useMutation(({ storage }, col: number, width: number) => {
        const columnWidths = storage.get("columnWidths");
        if (columnWidths) {
            columnWidths.set(String(col), width);
        }
    }, []);

    // Calculate Selection Stats (moved down to keep logic grouped, previous position was fine too)
    const selectionStats = useMemo(() => {
        if (!selectionRange || !cells) return null;

        const startRow = Math.min(selectionRange.start.row, selectionRange.end.row);
        const endRow = Math.max(selectionRange.start.row, selectionRange.end.row);
        const startCol = Math.min(selectionRange.start.col, selectionRange.end.col);
        const endCol = Math.max(selectionRange.start.col, selectionRange.end.col);

        // Only show stats if more than 1 cell selected
        if (startRow === endRow && startCol === endCol) return null;

        const values: number[] = [];

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
                onInsertRow={insertRow}
                onInsertColumn={insertColumn}
                onDeleteRow={deleteRow}
                onDeleteColumn={deleteColumn}
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
                    columnWidths={columnWidths || undefined}
                    onRangeSelect={(rangeStr) => {
                        // Append range to current formula
                        setFormulaBarValue(prev => prev + rangeStr);
                        if (activeCell) {
                            updateCell(activeCell, formulaBarValue + rangeStr);
                        }
                        setIsSelectingRange(false);
                    }}
                    onColumnResize={resizeColumn}
                />
            </div>

            <StatusBar selectionStats={selectionStats} />
        </div>
    );
}
