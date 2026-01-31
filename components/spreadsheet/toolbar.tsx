"use client";

import {
    Bold,
    Italic,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Palette,
    Underline as UnderlineIcon,
    Strikethrough,
    Type,
    PaintBucket
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface ToolbarProps {
    onStyleChange: (style: { [key: string]: any }) => void;
    activeStyles?: {
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
        strike?: boolean;
        align?: string;
        color?: string;
        background?: string;
    };
}

export function Toolbar({ onStyleChange, activeStyles = {} }: ToolbarProps) {
    const Separator = () => <div className="h-5 w-px bg-border mx-1" />;

    const ToggleButton = ({
        icon: Icon,
        isActive,
        onClick,
        label,
        color
    }: {
        icon: any,
        isActive?: boolean,
        onClick: () => void,
        label: string,
        color?: string
    }) => (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    onClick={onClick}
                    className={`p-1.5 rounded-sm transition-all ${isActive
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                >
                    <Icon className="w-4 h-4" style={{ color }} />
                </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
                {label}
            </TooltipContent>
        </Tooltip>
    );

    return (
        <TooltipProvider delayDuration={300}>
            <div className="flex items-center gap-0.5 p-1.5 border-b bg-[#F9FBFD] dark:bg-background h-10 overflow-x-auto">
                <ToggleButton
                    icon={Undo2}
                    onClick={() => { }}
                    label="Undo (Ctrl+Z)"
                />
                <ToggleButton
                    icon={Redo2}
                    onClick={() => { }}
                    label="Redo (Ctrl+Y)"
                />

                <Separator />

                <ToggleButton
                    icon={Bold}
                    isActive={activeStyles.bold}
                    onClick={() => onStyleChange({ bold: !activeStyles.bold })}
                    label="Bold (Ctrl+B)"
                />
                <ToggleButton
                    icon={Italic}
                    isActive={activeStyles.italic}
                    onClick={() => onStyleChange({ italic: !activeStyles.italic })}
                    label="Italic (Ctrl+I)"
                />
                <ToggleButton
                    icon={UnderlineIcon}
                    isActive={activeStyles.underline}
                    onClick={() => onStyleChange({ underline: !activeStyles.underline })}
                    label="Underline (Ctrl+U)"
                />
                <ToggleButton
                    icon={Strikethrough}
                    isActive={activeStyles.strike}
                    onClick={() => onStyleChange({ strike: !activeStyles.strike })}
                    label="Strikethrough (Alt+Shift+5)"
                />

                <Separator />

                <div className="relative group">
                    <ToggleButton
                        icon={Type}
                        onClick={() => { }}
                        label="Text Color"
                        color={activeStyles.color || undefined}
                    />
                    <div className="absolute top-full left-0 mt-1 p-2 bg-popover border rounded-lg shadow-lg hidden group-hover:block z-50 w-32">
                        <div className="grid grid-cols-5 gap-1">
                            {['#000000', '#434343', '#666666', '#999999', '#D9D9D9', '#ffffff', '#EF4444', '#EAB308', '#22C55E', '#3B82F6', '#A855F7'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => onStyleChange({ color })}
                                    className="w-5 h-5 rounded hover:scale-110 transition-transform border border-border/50"
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="relative group">
                    <ToggleButton
                        icon={PaintBucket}
                        onClick={() => { }}
                        label="Fill Color"
                        color={activeStyles.background || undefined}
                    />
                    <div className="absolute top-full left-0 mt-1 p-2 bg-popover border rounded-lg shadow-lg hidden group-hover:block z-50 w-32">
                        <div className="grid grid-cols-5 gap-1">
                            {['transparent', '#FEE2E2', '#FEF3C7', '#DCFCE7', '#DBEAFE', '#F3E8FF', '#E5E7EB', '#D1D5DB'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => onStyleChange({ background: color === 'transparent' ? undefined : color })}
                                    className={`w-5 h-5 rounded hover:scale-110 transition-transform border border-border/50 ${color === 'transparent' ? 'bg-background relative overflow-hidden' : ''}`}
                                    style={{ backgroundColor: color !== 'transparent' ? color : undefined }}
                                >
                                    {color === 'transparent' && <div className="absolute inset-0 border-r border-red-500 transform rotate-45"></div>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <Separator />

                <ToggleButton
                    icon={AlignLeft}
                    isActive={activeStyles.align === "left" || !activeStyles.align}
                    onClick={() => onStyleChange({ align: "left" })}
                    label="Align Left"
                />
                <ToggleButton
                    icon={AlignCenter}
                    isActive={activeStyles.align === "center"}
                    onClick={() => onStyleChange({ align: "center" })}
                    label="Align Center"
                />
                <ToggleButton
                    icon={AlignRight}
                    isActive={activeStyles.align === "right"}
                    onClick={() => onStyleChange({ align: "right" })}
                    label="Align Right"
                />
            </div>
        </TooltipProvider>
    );
}

// Dummy imports for icons not available in all lucide versions, fallback handles logic
import { Undo2, Redo2 } from "lucide-react";
