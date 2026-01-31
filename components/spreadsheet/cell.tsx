"use client";

import { useEffect, useState, useRef, KeyboardEvent } from "react";
import { Cell as CellType, CellPos } from "./types";
import { evaluateFormula } from "./utils";
import { motion, AnimatePresence } from "framer-motion";

interface CellComponentProps {
    pos: CellPos;
    data: CellType | undefined;
    isActive: boolean;
    isSelected: boolean;
    onUpdate: (val: string) => void;
    onFocus: () => void;
    getCellValue: (row: number, col: number) => string | number;
}

const FORMULA_SUGGESTIONS = ["SUM", "AVERAGE", "COUNT", "MAX", "MIN"];

export function CellComponent({
    pos,
    data,
    isActive,
    isSelected,
    onUpdate,
    onFocus,
    getCellValue,
}: CellComponentProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionIndex, setSuggestionIndex] = useState(0);

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
        if (showSuggestions) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSuggestionIndex((prev) => (prev + 1) % FORMULA_SUGGESTIONS.length);
                return;
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setSuggestionIndex((prev) => (prev - 1 + FORMULA_SUGGESTIONS.length) % FORMULA_SUGGESTIONS.length);
                return;
            }
            if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                applySuggestion(FORMULA_SUGGESTIONS[suggestionIndex]);
                return;
            }
        }

        if (e.key === "Enter") {
            setIsEditing(false);
            onUpdate(editValue);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setEditValue(val);

        // Simple suggestion trigger: starts with "=" and has some letters
        if (val.startsWith("=") && val.length > 1) {
            const match = val.match(/=([A-Z]*)$/i);
            if (match) {
                setShowSuggestions(true);
            } else {
                setShowSuggestions(false);
            }
        } else {
            setShowSuggestions(false);
        }
    };

    const applySuggestion = (suggestion: string) => {
        setEditValue(`=${suggestion}(`);
        setShowSuggestions(false);
        inputRef.current?.focus();
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
    const textDecoration = [
        style.underline ? "underline" : "",
        style.strike ? "line-through" : ""
    ].filter(Boolean).join(" ");
    const color = style.color || "inherit";
    const backgroundColor = style.background || undefined;

    return (
        <div
            className={`relative min-w-[80px] h-8 border-b border-r border-border text-sm flex items-center px-1 overflow-visible
        ${isActive ? "ring-2 ring-emerald-500 z-20" : ""}
        ${isSelected && !isActive ? "bg-emerald-200/50 dark:bg-emerald-900/40" : ""}
        `}
            style={{ textAlign, fontWeight, fontStyle, textDecoration, color, backgroundColor }}
            onClick={onFocus}
            onDoubleClick={handleDoubleClick}
        >
            {isEditing ? (
                <>
                    <input
                        ref={inputRef}
                        type="text"
                        className="absolute inset-0 w-full h-full px-1 bg-background text-foreground outline-none z-30"
                        value={editValue}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        onBlur={() => {
                            // Delay slightly to allow suggestion click
                            setTimeout(() => {
                                setIsEditing(false);
                                onUpdate(editValue);
                            }, 100);
                        }}
                    />
                    <AnimatePresence>
                        {showSuggestions && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute top-full left-0 w-48 bg-popover border border-border shadow-lg rounded-md z-40 overflow-hidden"
                            >
                                {FORMULA_SUGGESTIONS.map((suggestion, index) => (
                                    <div
                                        key={suggestion}
                                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground ${index === suggestionIndex ? "bg-accent text-accent-foreground" : ""
                                            }`}
                                        onMouseDown={(e) => {
                                            e.preventDefault(); // Prevent blur
                                            applySuggestion(suggestion);
                                        }}
                                    >
                                        <div className="font-medium">{suggestion}</div>
                                        <div className="text-xs text-muted-foreground">Function</div>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            ) : (
                <span className="truncate w-full select-none pointer-events-none">{displayValue}</span>
            )}
        </div>
    );
}
