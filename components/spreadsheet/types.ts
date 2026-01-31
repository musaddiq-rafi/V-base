export type CellId = string; // "row,col"

export type CellStyle = {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strike?: boolean;
    color?: string;
    background?: string;
    align?: "left" | "center" | "right";
    format?: "currency" | "percent" | "number"; // New format property
};

export type Cell = {
    value: string;
    formula?: string;
    style?: CellStyle;
};

export interface CellPos {
    row: number;
    col: number;
}
