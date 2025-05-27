// TODO: - Trap focus in the modal
// TODO: - Support fuzzy search / not requiring full word match
// TODO: - Keyboard nav through results with hints at bottom or top of modal
// TODO: - Hint for escape to close at bottom or top of modal
// TODO: - Click outside modal to close
// TODO: - Results / snippet highlighting (highlighting on results page?)
// TODO: - Debounce input
// TODO: - Add error notice at top of modal if index fails to load
// TODO: - Refine metaTitle slugification to align more with Storybook's pattern if possible
// TODO: - Parse JSX
// TODO: - Clean up component
// TODO: - Re-index on Storybook HMR. See preset.ts (Shallow? Only re-index what changes. Hashing?)

import React, { useEffect, useRef, useState } from "react";
import { SearchDoc } from "src/textsearch/search/buildTextIndex";
import { Document } from "flexsearch";

export const SearchBar = () => {
    const [docs, setDocs] = useState<SearchDoc[]>([]);
    const [index, setIndex] = useState<Document | null>(null);
    const [results, setResults] = useState<SearchDoc[]>([]);
    const [overlayOpen, setOverlayOpen] = useState(false);
    const [overlayQuery, setOverlayQuery] = useState("");
    const modalInputRef = useRef<HTMLInputElement>(null);

    // ✅ Load both docs and FlexSearch index
    useEffect(() => {
        const load = async () => {
            const [docsRes, indexRes] = await Promise.all([
                fetch("text-search-docs.json").then(r => r.json()),
                fetch("text-search-index.json").then(r => r.json()).then(data => data as Record<string, string>),
            ]);

            setDocs(docsRes);

            const restored = new Document({
                document: {
                    id: 'id',
                    index: ['title', 'content'],
                    store: ['id', 'title', 'content', 'snippet', 'sourcePath', 'type']
                }
            });

            for (const [key, data] of Object.entries(indexRes)) {
                restored.import(key, data);
            }
            console.log("restored", restored);
            setIndex(restored);
        };

        load().catch(err => console.error("❌ Failed to load search index:", err));
    }, []);

    // 🔍 Run actual FlexSearch on input change
    useEffect(() => {
        if (!index || overlayQuery.length <= 1) {
            console.warn("No index or query length <= 1");
            setResults([]);
            return;
        }

        const res = index.search(overlayQuery, { enrich: true }) as any;
        const unique = new Map<string, SearchDoc>();

        for (const fieldResult of res) {
            for (const entry of fieldResult.result) {
                if (entry?.doc?.id) {
                    unique.set(entry.doc.id, entry.doc as SearchDoc);
                }
            }
        }
        setResults([...unique.values()]);
    }, [overlayQuery, index]);

    // 🎹 Hotkey listener
    useEffect(() => {
        const isMac = navigator.userAgent.includes("Mac");
        const handler = (e: KeyboardEvent) => {
            const cmdKey = isMac ? e.metaKey : e.ctrlKey;
            if (cmdKey && e.shiftKey && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setOverlayOpen(true);
                setTimeout(() => modalInputRef.current?.focus(), 20);
            }
            if (e.key === "Escape") {
                setOverlayOpen(false);
                setOverlayQuery("");
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    // 🧭 Handle future navigation
    const handleClick = (doc: SearchDoc) => {
        if (doc.metaTitle) {
            const formatted = doc.metaTitle.toLowerCase().replace(/^\//, '').replace(/[\/\s_]+/g, '-');
            window.location.href = `/?path=/docs/${formatted}`;
        } else if (doc.storyId) {
            window.location.href = `/?path=/docs/${doc.storyId}`;
        } else {
            console.warn("No story ID found for doc", doc);
        }
    };

    return (
        <>
            {/* Always-visible toolbar input (not functional) */}
            <div style={{ position: "relative", display: "inline-block" }}>
                <input
                    placeholder="Search"
                    readOnly
                    onClick={() => setOverlayOpen(true)}
                    style={{
                        padding: "4px 8px",
                        paddingRight: "48px",
                        fontSize: 12,
                        height: 28,
                        borderRadius: 4,
                        border: "1px solid #ccc",
                        fontFamily: "inherit",
                        cursor: "pointer",
                    }}
                />
                <span
                    style={{
                        position: "absolute",
                        right: 8,
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: 11,
                        background: "transparent",
                        color: "#999",
                        fontFamily: "monospace",
                        pointerEvents: "none",
                    }}
                >
                    ⇧⌘K
                </span>
            </div>

            {/* Overlay modal */}
            {overlayOpen && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.4)",
                        backdropFilter: "blur(8px)",
                        zIndex: 9999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 24,
                    }}
                >
                    <div
                        style={{
                            background: "#fff",
                            width: "100%",
                            maxWidth: 640,
                            borderRadius: 8,
                            padding: 24,
                            boxShadow: "0 12px 24px rgba(0,0,0,0.2)",
                        }}
                    >
                        <input
                            ref={modalInputRef}
                            value={overlayQuery}
                            onChange={(e) => setOverlayQuery(e.target.value)}
                            placeholder="Search docs and components"
                            style={{
                                width: "100%",
                                padding: "12px 16px",
                                fontSize: 16,
                                borderRadius: 6,
                                border: "1px solid #ccc",
                                marginBottom: 16,
                            }}
                        />
                        {results.length > 0 ? (
                            <ul
                                style={{
                                    listStyle: "none",
                                    padding: 0,
                                    margin: 0,
                                    maxHeight: 300,
                                    overflowY: "auto",
                                }}
                            >
                                {results.map((doc, i) => (
                                    <li
                                        key={i}
                                        style={{
                                            padding: "12px 0",
                                            borderBottom: "1px solid #eee",
                                            cursor: "pointer",
                                        }}
                                        onClick={() => handleClick(doc)}
                                    >
                                        <strong style={{ fontSize: 14 }}>
                                            {doc.metaTitle ?? doc.title}
                                        </strong>
                                        <br />
                                        <span
                                            style={{ fontSize: 13, color: "#666" }}
                                        >
                                            {doc.content.slice(0, 100)}...
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div style={{ fontSize: 14, color: "#888" }}>
                                No results found.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};