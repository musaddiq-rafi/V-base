export type CellId = string; // "row,col"

export type CellStyle = {
    bold?: boolean;
    italic?: boolean;
    color?: string;
    align?: "left" | "center" | "right";
};

export type Cell = {
    value: string;
    formula?: string;
    style?: CellStyle;
};

export type CellPos = {
    row: number;
    col: number;
};
