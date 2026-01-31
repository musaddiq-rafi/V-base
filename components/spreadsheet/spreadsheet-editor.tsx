"use client";

import { useMutation, useStorage } from "@liveblocks/react/suspense";
import { Grid } from "./grid";
import { Toolbar } from "./toolbar";
import { CellPos, Cell as CellType } from "./types";
import { useState } from "react";
import { LiveObject } from "@liveblocks/client";

interface SpreadsheetEditorProps {
    spreadsheetId: string;
}

export function SpreadsheetEditor({ spreadsheetId }: SpreadsheetEditorProps) {
    // We can pull selection state up here if we want Toolbar to react to selection
    // For MVP, Toolbar might just act on "last active" or we pass selection callback from Grid
    // Actually, Grid manages activeCell. To apply styles, toolbar needs to know active cell.
    // Let's hoist state or use a context. For MVP, passing props.

    // We need to access storage to update styles
    const updateStyle = useMutation(({ storage }, style: any) => {
        // We need to know which cell to update. 
        // Providing a global selection or just "currently focused" logic is tricky if state is inside Grid.
        // Let's simply expose a way or move activeCell state up.
        // For simplicity: We will assume single cell selection for now.
        // But wait, Grid has the state.
    }, []);

    // REFACTOR: Moving ActiveCell state to Editor to share with Toolbar
    const [activeCell, setActiveCell] = useState<CellPos | null>(null);
    const cells = useStorage((root) => root.spreadsheet);

    const handleStyleChange = useMutation(({ storage }, style: any) => {
        if (!activeCell) return;
        const cellId = `${activeCell.row},${activeCell.col}`;
        const spreadsheet = storage.get("spreadsheet");
        // Guard against undefined spreadsheet
        if (!spreadsheet) return;

        const currentCell = spreadsheet.get(cellId);

        if (currentCell) {
            const currentData = currentCell.toObject();
            const newStyle = { ...currentData.style, ...style };

            // Toggle logic for booleans
            if (style.bold !== undefined && currentData.style?.bold === style.bold) delete newStyle.bold; // Simple toggle check might need more robust logic
            // Actually toolbar passes the NEW state normally.

            spreadsheet.set(cellId, new LiveObject({
                ...currentData,
                style: newStyle
            }));
        } else {
            // Cell doesn't exist (empty), create it with just style
            spreadsheet.set(cellId, new LiveObject({
                value: "",
                style: style
            }));
        }
    }, [activeCell]);

    // Derived active style
    const activeStyle = activeCell && cells ? cells.get(`${activeCell.row},${activeCell.col}`)?.style : {};

    return (
        <div className="flex flex-col h-full bg-background">
            <Toolbar onStyleChange={handleStyleChange} activeStyles={activeStyle} />
            <div className="flex-1 overflow-hidden">
                {/* 
                   We need to refactor Grid to accept activeCell and setActiveCell 
                   if we want to control it from here. 
                   Or just pass the style mutation function down?
                   Hoisting state is better.
                */}
                <GridWrapper
                    activeCell={activeCell}
                    setActiveCell={setActiveCell}
                />
            </div>
        </div>
    );
}

// Wrapper to adapt the Grid component (which I defined in previous step with internal state)
// I will need to update Grid component in next step to accept props, 
// OR I just redefine Grid here if it was small? 
// No, Grid was large. I should update Grid to take props.
// Let's update implementation of Grid in next step to accept props.
import { Grid as GridComponent } from "./grid";

function GridWrapper({ activeCell, setActiveCell }: { activeCell: CellPos | null, setActiveCell: (p: CellPos | null) => void }) {
    return <GridComponent activeCell={activeCell} onActiveCellChange={setActiveCell} />;
}
