
import { Tokenizer, Token } from "./tokenizer";
import { parseRange, parseCellId } from "./utils";
import { Cell } from "./types";

type GetCellValue = (row: number, col: number) => number;

export class FormulaInterpreter {
    private tokens: Token[] = [];
    private pos = 0;
    private getValue: GetCellValue;

    constructor(formula: string, getValue: GetCellValue) {
        this.getValue = getValue;
        const tokenizer = new Tokenizer(formula.startsWith("=") ? formula.substring(1) : formula);
        let token = tokenizer.next();
        while (token.type !== "EOF") {
            this.tokens.push(token);
            token = tokenizer.next();
        }
    }

    public evaluate(): number {
        try {
            const result = this.parseExpression();
            return result;
        } catch (e) {
            console.error(e);
            return NaN;
        }
    }

    private peek(): Token {
        return this.tokens[this.pos];
    }

    private consume(): Token {
        return this.tokens[this.pos++];
    }

    private parseExpression(): number {
        let left = this.parseTerm();

        while (this.pos < this.tokens.length) {
            const op = this.peek();
            if (op.type === "OPERATOR" && (op.value === "+" || op.value === "-")) {
                this.consume();
                const right = this.parseTerm();
                if (op.value === "+") left += right;
                else left -= right;
            } else {
                break;
            }
        }
        return left;
    }

    private parseTerm(): number {
        let left = this.parseFactor();

        while (this.pos < this.tokens.length) {
            const op = this.peek();
            if (op.type === "OPERATOR" && (op.value === "*" || op.value === "/")) {
                this.consume();
                const right = this.parseFactor();
                if (op.value === "*") left *= right;
                else left /= right;
            } else {
                break;
            }
        }
        return left;
    }

    private parseFactor(): number {
        const token = this.peek();

        if (token.type === "NUMBER") {
            this.consume();
            return parseFloat(token.value);
        }

        if (token.type === "CELL_REF") {
            this.consume();
            const pos = parseCellId(token.value);
            if (!pos) return 0;
            return this.getValue(pos.row, pos.col);
        }

        if (token.type === "FUNCTION") {
            return this.parseFunction();
        }

        if (token.type === "LPAREN") {
            this.consume();
            const val = this.parseExpression();
            if (this.peek().type === "RPAREN") {
                this.consume();
            }
            return val;
        }

        // Default 0 if unknown
        this.consume();
        return 0;
    }

    private parseFunction(): number {
        const funcToken = this.consume(); // SUM
        if (this.peek().type !== "LPAREN") return 0;
        this.consume(); // (

        const args: number[] = [];

        // Parse arguments
        while (this.pos < this.tokens.length && this.peek().type !== "RPAREN") {
            // Check for RANGE first
            const token = this.peek();
            if (token.type === "RANGE_REF") {
                this.consume();
                const rangeCells = parseRange(token.value);
                for (const cid of rangeCells) {
                    const [r, c] = cid.split(",").map(Number);
                    args.push(this.getValue(r, c));
                }
            } else {
                args.push(this.parseExpression());
            }

            if (this.peek().type === "COMMA") {
                this.consume();
            }
        }

        if (this.peek().type === "RPAREN") this.consume();

        const name = funcToken.value;
        if (name === "SUM") return args.reduce((a, b) => a + b, 0);
        if (name === "AVERAGE") return args.length ? args.reduce((a, b) => a + b, 0) / args.length : 0;
        if (name === "MAX") return args.length ? Math.max(...args) : 0;
        if (name === "MIN") return args.length ? Math.min(...args) : 0;
        if (name === "COUNT") return args.length;

        return 0;
    }
}
