"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation, useStorage } from "@liveblocks/react/suspense";
import { LiveObject } from "@liveblocks/client";
import { CellComponent } from "./cell";
import { Cell as CellType, CellPos } from "./types";
import { getColLabel } from "./utils";

const ROWS = 50;
const COLS = 26; // A-Z

interface GridProps {
    activeCell: CellPos | null;
    selectionRange: { start: CellPos; end: CellPos } | null;
    onSelectionChange: (range: { start: CellPos; end: CellPos } | null) => void;
    onActiveCellChange: (pos: CellPos | null) => void;

    // Formula range selection mode
    isSelectingRange: boolean;
    onRangeSelect?: (range: string) => void;
}

export function Grid({
    activeCell,
    selectionRange,
    onSelectionChange,
    onActiveCellChange,
    isSelectingRange,
    onRangeSelect
}: GridProps) {
    const [isDragging, setIsDragging] = useState(false);
    const gridContainerRef = useRef<HTMLDivElement>(null);

    // Liveblocks storage
    const cells = useStorage((root) => root.spreadsheet);

    const updateCell = useMutation(({ storage }, pos: CellPos, val: string) => {
        const spreadsheet = storage.get("spreadsheet");
        if (!spreadsheet) return;

        const cellId = `${pos.row},${pos.col}`;

        // Check if it's a formula
        const isFormula = val.startsWith("=");
        const cellData: CellType = {
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

    const getCellValue = useCallback((row: number, col: number) => {
        const cellId = `${row},${col}`;
        const cell = cells?.get(cellId);
        if (!cell) return "";
        return cell.value;
    }, [cells]);

    // Handle mouse events for selection
    const handleMouseDown = (row: number, col: number) => {
        if (isSelectingRange) {
            // In formula selection mode, we might just click one cell or start drag
            // Logic handled below
        } else {
            onActiveCellChange({ row, col });
        }

        onSelectionChange({ start: { row, col }, end: { row, col } });
        setIsDragging(true);
    };

    const handleMouseEnter = (row: number, col: number) => {
        if (isDragging && selectionRange) {
            const newRange = { ...selectionRange, end: { row, col } };
            onSelectionChange(newRange);
        }
    };

    const handleMouseUp = () => {
        if (isSelectingRange && selectionRange && onRangeSelect) {
            const startCol = getColLabel(Math.min(selectionRange.start.col, selectionRange.end.col));
            const startRow = Math.min(selectionRange.start.row, selectionRange.end.row) + 1;
            const endCol = getColLabel(Math.max(selectionRange.start.col, selectionRange.end.col));
            const endRow = Math.max(selectionRange.start.row, selectionRange.end.row) + 1;

            const rangeString = (startCol === endCol && startRow === endRow)
                ? `${startCol}${startRow}`
                : `${startCol}${startRow}:${endCol}${endRow}`;

            onRangeSelect(rangeString);
        }
        setIsDragging(false);
    };

    // Global mouse up to catch release outside grid
    useEffect(() => {
        const handleGlobalMouseUp = () => setIsDragging(false);
        window.addEventListener("mouseup", handleGlobalMouseUp);
        return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
    }, []);


    // Check if cell is in selection
    const isInSelection = (row: number, col: number) => {
        if (!selectionRange) return false;
        const minRow = Math.min(selectionRange.start.row, selectionRange.end.row);
        const maxRow = Math.max(selectionRange.start.row, selectionRange.end.row);
        const minCol = Math.min(selectionRange.start.col, selectionRange.end.col);
        const maxCol = Math.max(selectionRange.start.col, selectionRange.end.col);

        return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
    };

    return (
        <div
            className="flex-1 overflow-auto h-full relative bg-background select-none"
            ref={gridContainerRef}
            onMouseLeave={() => setIsDragging(false)}
        >
            <div className="inline-block min-w-full relative">

                {/* Header Row (Column Labels) - Sticky Top */}
                <div className="flex sticky top-0 z-40 bg-[#F8F9FA] dark:bg-muted/20 border-b border-border shadow-sm">
                    {/* Top-Left Corner Spacer */}
                    <div className="flex-shrink-0 w-10 h-8 bg-[#F8F9FA] dark:bg-muted/20 border-r border-border sticky left-0 z-50"></div>

                    {/* Column Labels */}
                    {Array.from({ length: COLS }).map((_, col) => {
                        const isSelected = selectionRange &&
                            col >= Math.min(selectionRange.start.col, selectionRange.end.col) &&
                            col <= Math.max(selectionRange.start.col, selectionRange.end.col);

                        return (
                            <div
                                key={col}
                                className={`flex-shrink-0 w-[80px] h-8 border-r border-border flex items-center justify-center text-xs font-bold transition-colors ${isSelected ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-b-2 border-b-emerald-500" : "text-muted-foreground"
                                    }`}
                            >
                                {getColLabel(col)}
                            </div>
                        );
                    })}
                </div>

                {/* Rows Area */}
                <div className="flex flex-col">
                    {Array.from({ length: ROWS }).map((_, row) => {
                        const isRowSelected = selectionRange &&
                            row >= Math.min(selectionRange.start.row, selectionRange.end.row) &&
                            row <= Math.max(selectionRange.start.row, selectionRange.end.row);

                        return (
                            <div key={row} className="flex">
                                {/* Row Header (Sticky Left) */}
                                <div
                                    className={`flex-shrink-0 w-10 h-8 border-b border-r border-border bg-[#F8F9FA] dark:bg-muted/20 sticky left-0 z-30 flex items-center justify-center text-xs font-bold transition-colors ${isRowSelected ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-r-2 border-r-emerald-500" : "text-muted-foreground"
                                        }`}
                                >
                                    {row + 1}
                                </div>

                                {/* Cells */}
                                {Array.from({ length: COLS }).map((_, col) => {
                                    const cellId = `${row},${col}`;
                                    const cellData = cells?.get(cellId);
                                    const isActive = activeCell?.row === row && activeCell?.col === col;
                                    const isSelected = isInSelection(row, col);

                                    return (
                                        <div
                                            key={cellId}
                                            onMouseDown={() => handleMouseDown(row, col)}
                                            onMouseEnter={() => handleMouseEnter(row, col)}
                                            onMouseUp={handleMouseUp}
                                            className="relative"
                                        >
                                            <CellComponent
                                                pos={{ row, col }}
                                                data={cellData}
                                                isActive={isActive}
                                                isSelected={isSelected}
                                                onFocus={() => {
                                                    if (!isSelectingRange) {
                                                        onActiveCellChange({ row, col });
                                                        onSelectionChange({ start: { row, col }, end: { row, col } });
                                                    }
                                                }}
                                                onUpdate={(val) => updateCell({ row, col }, val)}
                                                getCellValue={getCellValue}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
