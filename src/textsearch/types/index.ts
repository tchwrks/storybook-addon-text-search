export type ExtractionRule =
    | string[] // shorthand
    | {
        props?: string[];
        children?: boolean;
        nestedTextSelectors?: string[];
    }
    | ((node: any) => string[]);

export interface ExtractionConfig {
    inputPaths: string | string[]; // support glob
    outputJson: boolean;
    jsxTextMap: Record<string, ExtractionRule>
}