import type { Index } from "flexsearch";
import type { SearchDoc } from "./buildTextIndex";

// Runtime cache
export let index: Index | null = null;
export let docs: SearchDoc[] = [];

export function setIndex(i: Index) {
    index = i;
}
export function setDocs(d: SearchDoc[]) {
    docs = d;
}