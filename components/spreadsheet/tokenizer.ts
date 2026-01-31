
export type TokenType =
    | "NUMBER"
    | "STRING"
    | "CELL_REF" // A1
    | "RANGE_REF" // A1:B2
    | "FUNCTION" // SUM, AVG...
    | "LPAREN"
    | "RPAREN"
    | "COMMA"
    | "OPERATOR" // +, -, *, /
    | "EOF";

export interface Token {
    type: TokenType;
    value: string;
}

export class Tokenizer {
    private pos = 0;
    private input: string;

    constructor(input: string) {
        this.input = input;
    }

    hasNext(): boolean {
        return this.pos < this.input.length;
    }

    peek(): string {
        return this.input[this.pos];
    }

    next(): Token {
        this.skipWhitespace();
        if (this.pos >= this.input.length) return { type: "EOF", value: "" };

        const char = this.input[this.pos];

        if (/[0-9]/.test(char)) return this.readNumber();
        if (/[A-Za-z]/.test(char)) return this.readIdentifier(); // Cell, Range, or Function
        if (char === '"') return this.readString();

        // Operators
        if ("+-*/".includes(char)) {
            this.pos++;
            return { type: "OPERATOR", value: char };
        }

        if (char === "(") { this.pos++; return { type: "LPAREN", value: "(" }; }
        if (char === ")") { this.pos++; return { type: "RPAREN", value: ")" }; }
        if (char === ",") { this.pos++; return { type: "COMMA", value: "," }; }
        if (char === ":") { this.pos++; return { type: "OPERATOR", value: ":" }; } // Should be handled in identifier for Range? Or here.

        this.pos++; // Unknown
        return { type: "EOF", value: "" };
    }

    private skipWhitespace() {
        while (this.pos < this.input.length && /\s/.test(this.input[this.pos])) {
            this.pos++;
        }
    }

    private readNumber(): Token {
        let res = "";
        while (this.pos < this.input.length && /[0-9.]/.test(this.input[this.pos])) {
            res += this.input[this.pos++];
        }
        return { type: "NUMBER", value: res };
    }

    private readString(): Token {
        this.pos++; // skip quote
        let res = "";
        while (this.pos < this.input.length && this.input[this.pos] !== '"') {
            res += this.input[this.pos++];
        }
        this.pos++; // skip closing quote
        return { type: "STRING", value: res };
    }

    private readIdentifier(): Token {
        let res = "";
        while (this.pos < this.input.length && /[A-Za-z0-9]/.test(this.input[this.pos])) {
            res += this.input[this.pos++];
        }

        // Check for Range (A1:B2)
        if (this.pos < this.input.length && this.input[this.pos] === ':') {
            this.pos++; // skip :
            let endPart = "";
            while (this.pos < this.input.length && /[A-Za-z0-9]/.test(this.input[this.pos])) {
                endPart += this.input[this.pos++];
            }
            return { type: "RANGE_REF", value: res + ":" + endPart };
        }

        // Check if Cell Ref (A1) or Function (SUM)
        if (/[A-Z]+[0-9]+/.test(res)) {
            return { type: "CELL_REF", value: res };
        }

        return { type: "FUNCTION", value: res.toUpperCase() };
    }
}
