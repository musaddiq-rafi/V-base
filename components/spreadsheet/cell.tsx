"use client";

import { useEffect, useState, useRef, KeyboardEvent } from "react";
import { Cell as CellType, CellPos } from "./types";
import { evaluateFormula } from "./utils";

interface CellComponentProps {
    pos: CellPos;
    data: CellType | undefined;
    isActive: boolean;
    isSelected: boolean; // Part of range selection (future)
    onUpdate: (val: string) => void;
    onFocus: () => void;
    getCellValue: (row: number, col: number) => string | number;
}

export function CellComponent({
    pos,
    data,
    isActive,
    onUpdate,
    onFocus,
    getCellValue,
}: CellComponentProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync edit value when starting edit
    useEffect(() => {
        if (isEditing) {
            setEditValue(data?.formula || data?.value || "");
            inputRef.current?.focus();
        }
    }, [isEditing, data]);

    // Handle outside click to stop editing
    useEffect(() => {
        if (!isActive && isEditing) {
            setIsEditing(false);
        }
    }, [isActive, isEditing]);

    const handleDoubleClick = () => {
        setIsEditing(true);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
            setIsEditing(false);
            onUpdate(editValue);
        }
    };

    // Calculate display value
    const displayValue = data?.formula
        ? evaluateFormula(data.formula, getCellValue)
        : data?.value || "";

    // Styles
    const style = data?.style || {};
    const textAlign = style.align || "left";
    const fontWeight = style.bold ? "bold" : "normal";
    const fontStyle = style.italic ? "italic" : "normal";
    const color = style.color || "inherit";

    return (
        <div
            className={`relative min-w-[80px] h-8 border-b border-r border-border text-sm flex items-center px-1 overflow-hidden
        ${isActive ? "ring-2 ring-primary z-10" : ""}`}
            style={{ textAlign, fontWeight, fontStyle, color }}
            onClick={onFocus}
            onDoubleClick={handleDoubleClick}
        >
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    className="absolute inset-0 w-full h-full px-1 bg-background text-foreground outline-none"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => {
                        setIsEditing(false);
                        onUpdate(editValue);
                    }}
                />
            ) : (
                <span className="truncate w-full select-none">{displayValue}</span>
            )}
        </div>
    );
}
