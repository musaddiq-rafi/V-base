"use client";

import { useState, useCallback } from "react";
import { useMutation, useStorage } from "@liveblocks/react/suspense";
import { LiveObject } from "@liveblocks/client";
import { CellComponent } from "./cell";
import { Cell as CellType, CellPos } from "./types";
import { getColLabel } from "./utils";

const ROWS = 50;
const COLS = 26; // A-Z

// Update props
interface GridProps {
    activeCell?: CellPos | null;
    onActiveCellChange?: (pos: CellPos | null) => void;
}

export function Grid({ activeCell: controlledActiveCell, onActiveCellChange }: GridProps) {
    const [internalActiveCell, setInternalActiveCell] = useState<CellPos | null>(null);

    const activeCell = controlledActiveCell !== undefined ? controlledActiveCell : internalActiveCell;
    const setActiveCell = (pos: CellPos | null) => {
        if (onActiveCellChange) onActiveCellChange(pos);
        else setInternalActiveCell(pos);
    };

    // Liveblocks storage
    // The types are inferred from liveblocks.config.ts but explicit casting helps if config is not fully picked up yet
    const cells = useStorage((root) => root.spreadsheet);

    const updateCell = useMutation(({ storage }, pos: CellPos, val: string) => {
        const spreadsheet = storage.get("spreadsheet");
        // Guard against undefined spreadsheet
        if (!spreadsheet) return;

        const cellId = `${pos.row},${pos.col}`;

        // Check if it's a formula
        const isFormula = val.startsWith("=");
        const cellData: CellType = {
            value: isFormula ? "" : val,
            formula: isFormula ? val : undefined,
            // Preserve style if exists
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


    return (
        <div className="flex flex-col h-full overflow-hidden select-none">
            {/* Column Headers */}
            <div className="flex ml-10 border-b border-border bg-muted/20">
                {Array.from({ length: COLS }).map((_, col) => (
                    <div
                        key={col}
                        className="flex-shrink-0 w-[80px] h-8 border-r border-border flex items-center justify-center text-xs font-medium text-muted-foreground bg-muted/50"
                    >
                        {getColLabel(col)}
                    </div>
                ))}
            </div>

            <div className="flex-1 overflow-auto flex">
                {/* Row Headers */}
                <div className="flex-shrink-0 w-10 border-r border-border bg-muted/20">
                    {Array.from({ length: ROWS }).map((_, row) => (
                        <div
                            key={row}
                            className="h-8 border-b border-border flex items-center justify-center text-xs font-medium text-muted-foreground bg-muted/50"
                        >
                            {row + 1}
                        </div>
                    ))}
                </div>

                {/* Cells Grid */}
                <div className="relative">
                    {Array.from({ length: ROWS }).map((_, row) => (
                        <div key={row} className="flex">
                            {Array.from({ length: COLS }).map((_, col) => {
                                const cellId = `${row},${col}`;
                                const cellData = cells?.get(cellId); // Accessing LiveMap
                                const isActive = activeCell?.row === row && activeCell?.col === col;

                                return (
                                    <CellComponent
                                        key={cellId}
                                        pos={{ row, col }}
                                        data={cellData}
                                        isActive={isActive}
                                        isSelected={false}
                                        onFocus={() => setActiveCell({ row, col })}
                                        onUpdate={(val) => updateCell({ row, col }, val)}
                                        getCellValue={getCellValue}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
