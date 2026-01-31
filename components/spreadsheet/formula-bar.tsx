"use client";

import { FunctionSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CellPos } from "./types";
import { getColLabel } from "./utils";

interface FormulaBarProps {
    activeCell: CellPos | null;
    value: string;
    onChange: (value: string) => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
}

export function FormulaBar({ activeCell, value, onChange, onKeyDown }: FormulaBarProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Focus input when user types elsewhere if logic permits, but for now simple sync

    // Derived cell label (e.g., A1)
    const label = activeCell ? `${getColLabel(activeCell.col)}${activeCell.row + 1}` : "";

    return (
        <div className="flex items-center h-10 border-b border-border bg-background px-2 gap-2">
            {/* Cell Selection Indicator */}
            <div className="relative flex items-center justify-center w-10 h-7 bg-muted/50 border border-border rounded text-sm font-medium text-muted-foreground">
                {label}
            </div>

            <div className="h-6 w-px bg-border mx-1" />

            {/* Function Icon */}
            <div className={`p-1 rounded ${isFocused ? "bg-muted text-foreground" : "text-muted-foreground"}`}>
                <FunctionSquare className="w-4 h-4" />
            </div>

            {/* Input */}
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={onKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="flex-1 h-full bg-transparent border-none outline-none text-sm font-mono text-foreground px-2"
                placeholder={activeCell ? "Type something or start with =" : ""}
                disabled={!activeCell}
            />
        </div>
    );
}
