// TODO: - Graceful overlay/modal open/close + hiding/showing of modal shortcuts (subtle fade in/out + translation?)
// TODO: - Results / snippet highlighting (highlighting on results page?)
// TODO: - Debounce input
// TODO: - Add error notice at top of modal if index fails to load
// TODO: - Refine metaTitle slugification to align more with Storybook's pattern if possible
// TODO: - Parse JSX
// TODO: - Clean up component
// TODO: - Re-index on Storybook HMR. See preset.ts (Shallow? Only re-index what changes. Hashing?)

import React, { useEffect, useRef, useState } from "react";
import { Document } from "flexsearch";
import { FocusTrap } from "focus-trap-react";
import { SearchDoc } from "src/textsearch/search/buildTextIndex";
import { TechworksComboMark } from "src/components/TechworksComboMark";

export const SearchBar = () => {
    const [index, setIndex] = useState<Document | null>(null);
    const [results, setResults] = useState<SearchDoc[]>([]);
    const [overlayOpen, setOverlayOpen] = useState<boolean>(false);
    const [overlayQuery, setOverlayQuery] = useState<string>("");
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const modalInputRef = useRef<HTMLInputElement>(null);

    // ✅ Load both docs and FlexSearch index
    useEffect(() => {
        const load = async () => {
            // ! Remove docsRes. Only using index/indexRes
            const [docsRes, indexRes] = await Promise.all([
                fetch("text-search-docs.json").then(r => r.json()),
                fetch("text-search-index.json").then(r => r.json()).then(data => data as Record<string, string>),
            ]);


            const restored = new Document({
                tokenize: "forward",
                document: {
                    id: 'id',
                    index: ['title', 'content'],
                    store: ['id', 'title', 'content', 'snippet', 'sourcePath', 'metaTitle', 'type']
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

        const res = index.search(overlayQuery, { enrich: true, suggest: true, limit: 10 }) as any;
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

    // 🔄 Reset selected index when results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [results]);

    // 🎹 Hotkey listener
    useEffect(() => {
        const isMac = navigator.userAgent.includes("Mac");
        const handler = (e: KeyboardEvent) => {
            const cmdKey = isMac ? e.metaKey : e.ctrlKey;
            // Hotkey to open modal
            if (cmdKey && e.shiftKey && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setOverlayOpen(true);
                setTimeout(() => modalInputRef.current?.focus(), 20);
            }
            // Escape to close modal
            if (e.key === "Escape") {
                setOverlayOpen(false);
                setOverlayQuery("");
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    // 🎯 Handle clicks outside the modal
    const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        setOverlayOpen(false);
        setOverlayQuery("");
    }

    // 🎹 Modal input hotkey listener
    const handleModalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (overlayOpen && results.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === "Enter") {
                e.preventDefault();
                const doc = results[selectedIndex];
                if (doc) handleClick(doc);
            } else if (e.key === "Tab") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % results.length);
            }
        }
    }

    // 🧭 Handle navigation to the selected doc
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
                    placeholder="Find text"
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
                <FocusTrap>
                    <div
                        style={{
                            position: "fixed",
                            inset: 0,
                            background: "rgba(0,0,0,0.4)",
                            backdropFilter: "blur(8px)",
                            zIndex: 9999,
                            display: "flex",
                            alignItems: "start",
                            justifyContent: "center",
                            padding: 24,
                        }}
                        onClick={handleClickOutside}
                    >
                        <div
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: "#fff",
                                width: "100%",
                                maxWidth: 640,
                                borderRadius: 8,
                                padding: 24,
                                boxShadow: "0 12px 24px rgba(0,0,0,0.2)",
                            }}
                        >
                            <div
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 16,
                                    marginBottom: 16,
                                    paddingBottom: 16,
                                    borderBottom: "1px solid #eee",
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
                                    }}
                                    onKeyDown={handleModalKeyDown}
                                />
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: "#666",
                                        display: "flex",
                                        gap: 6
                                    }}
                                >
                                    <span style={{ fontWeight: "bold" }}>Shortcuts:</span>
                                    <span>ESC to close</span>
                                    <span>|</span>
                                    <span>↑↓ or Tab to navigate</span>
                                    <span>|</span>
                                    <span>↵ to open page</span>
                                </div>
                            </div>
                            {results.length > 0 ? (
                                <ul
                                    style={{
                                        listStyle: "none",
                                        padding: 0,
                                        margin: 0,
                                        maxHeight: 300,
                                        overflowY: "auto",
                                        overflowX: "hidden",
                                    }}
                                >
                                    {results.map((doc, i) => (
                                        <li
                                            key={i}
                                            onClick={() => handleClick(doc)}
                                            style={{
                                                borderRadius: 4,
                                                padding: "12px 8px",
                                                borderBottom: "1px solid #eee",
                                                cursor: "pointer",
                                                backgroundColor: i === selectedIndex ? "#f0f0f0" : "transparent",
                                            }}
                                        >
                                            <strong style={{ fontSize: 14 }}>
                                                {doc.metaTitle ?? doc.title}
                                            </strong>
                                            <br />
                                            <span
                                                style={{
                                                    fontSize: 13,
                                                    color: "#666",
                                                    display: "inline-block",
                                                    maxWidth: "100%",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                }}
                                            >
                                                {doc.snippet.slice(0, 100) || doc.content.slice(0, 100)}...
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div style={{ fontSize: 14, color: "#888", width: "100%", textAlign: "center" }}>
                                    No results found.
                                </div>
                            )}
                            {/* Enchufe y respectos */}
                            <div
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    fontSize: 12,
                                    color: "#888",
                                    gap: 8,
                                    marginTop: 16,
                                }}
                            >
                                <a href="https://techworks.studio" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                                    <span
                                        style={{
                                            display: "flex",
                                            color: "#888",
                                            alignItems: "center",
                                            gap: 4,
                                            cursor: "pointer"
                                        }}
                                    >
                                        Brought to you by
                                        <TechworksComboMark height={14} />
                                    </span>
                                </a>
                                <span>|</span>
                                <a href="https://github.com/nextapps-de/flexsearch" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                                    <span style={{ color: "#888" }}>Powered by flexsearch</span>
                                </a>

                            </div>
                        </div>
                    </div>
                </FocusTrap>
            )}
        </>
    );
};