"use client";

interface StatusBarProps {
    selectionStats: {
        sum?: number;
        avg?: number;
        min?: number;
        max?: number;
        count?: number;
    } | null;
}

export function StatusBar({ selectionStats }: StatusBarProps) {
    if (!selectionStats) return <div className="h-8 border-t border-border bg-muted/20" />;

    return (
        <div className="h-8 border-t border-border bg-background flex items-center justify-end px-4 gap-6 text-xs text-muted-foreground select-none">
            {selectionStats.count !== undefined && (
                <div className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-default">
                    <span className="font-medium">Count:</span>
                    <span>{selectionStats.count}</span>
                </div>
            )}
            {selectionStats.min !== undefined && (
                <div className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-default">
                    <span className="font-medium">Min:</span>
                    <span>{selectionStats.min}</span>
                </div>
            )}
            {selectionStats.max !== undefined && (
                <div className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-default">
                    <span className="font-medium">Max:</span>
                    <span>{selectionStats.max}</span>
                </div>
            )}
            {selectionStats.avg !== undefined && (
                <div className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-default">
                    <span className="font-medium">Avg:</span>
                    <span>{selectionStats.avg.toFixed(2)}</span>
                </div>
            )}
            {selectionStats.sum !== undefined && (
                <div className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-default text-emerald-600 dark:text-emerald-400">
                    <span className="font-bold">Sum:</span>
                    <span className="font-semibold">{selectionStats.sum}</span>
                </div>
            )}
        </div>
    );
}
