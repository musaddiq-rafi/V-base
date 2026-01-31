"use client";

import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, Palette } from "lucide-react";

interface ToolbarProps {
    onStyleChange: (style: { [key: string]: any }) => void;
    activeStyles?: {
        bold?: boolean;
        italic?: boolean;
        align?: string;
        color?: string;
    };
}

export function Toolbar({ onStyleChange, activeStyles = {} }: ToolbarProps) {
    return (
        <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
            {/* Bold */}
            <button
                onClick={() => onStyleChange({ bold: !activeStyles.bold })}
                className={`p-1.5 rounded hover:bg-muted ${activeStyles.bold ? "bg-muted text-foreground" : "text-muted-foreground"
                    }`}
                title="Bold"
            >
                <Bold className="w-4 h-4" />
            </button>

            {/* Italic */}
            <button
                onClick={() => onStyleChange({ italic: !activeStyles.italic })}
                className={`p-1.5 rounded hover:bg-muted ${activeStyles.italic ? "bg-muted text-foreground" : "text-muted-foreground"
                    }`}
                title="Italic"
            >
                <Italic className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-border mx-1" />

            {/* Alignment */}
            <button
                onClick={() => onStyleChange({ align: "left" })}
                className={`p-1.5 rounded hover:bg-muted ${activeStyles.align === "left" || !activeStyles.align ? "bg-muted text-foreground" : "text-muted-foreground"
                    }`}
                title="Align Left"
            >
                <AlignLeft className="w-4 h-4" />
            </button>

            <button
                onClick={() => onStyleChange({ align: "center" })}
                className={`p-1.5 rounded hover:bg-muted ${activeStyles.align === "center" ? "bg-muted text-foreground" : "text-muted-foreground"
                    }`}
                title="Align Center"
            >
                <AlignCenter className="w-4 h-4" />
            </button>

            <button
                onClick={() => onStyleChange({ align: "right" })}
                className={`p-1.5 rounded hover:bg-muted ${activeStyles.align === "right" ? "bg-muted text-foreground" : "text-muted-foreground"
                    }`}
                title="Align Right"
            >
                <AlignRight className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-border mx-1" />

            {/* Color (simplified) */}
            <div className="relative group">
                <button className="p-1.5 rounded hover:bg-muted text-muted-foreground">
                    <Palette className="w-4 h-4" />
                </button>
                <div className="absolute top-full left-0 mt-1 p-2 bg-popover border rounded-lg shadow-lg hidden group-hover:flex gap-1 z-50">
                    {['#000000', '#EF4444', '#10B981', '#3B82F6', '#F59E0B'].map(color => (
                        <button
                            key={color}
                            onClick={() => onStyleChange({ color })}
                            className="w-5 h-5 rounded-full border border-border"
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
