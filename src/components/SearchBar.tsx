// MVP:
// TODO: - Re-index on Storybook HMR. See preset.ts (Shallow? Only re-index what changes. Hashing?)
// TODO: - Remove JSX extraction code (just MDX for now) + any other unused code
// TODO: - Refine / double check metaTitle slugification to align more with Storybook's pattern if possible
// TODO: - Handle case where many results are returned (pagination, scroll within, etc.)
// TODO: - CLI init command + script 
// TODO:    - Generate .storybook-search directory (with config file -> make config file js compatible)
// TODO:    - Find .storybook/main file, parse it for stories/docs dirs, add addon to config, add index to static assets dir
// TODO:    - Generate initial index (with CLI)

// Post-MVP:
// TODO: - Create pre-processing pipeline for multi-keyword search + boolean operators
// TODO: - Debounce input (for pre-processing pipeline)
// TODO: - (React support) Parse JSX to extract story meta, JSDocs

import React, { useEffect, useRef, useState } from "react";
import { Document } from "flexsearch";
import { SearchDoc } from "src/textsearch/search/buildTextIndex";
import { getResultHighlightSnippet } from "src/textsearch/get/getHighlightSnippet";
import IndexNotFound from "src/components/IndexNotFound";
import ModalShortcuts from "src/components/search-modal/ModalShortcuts";
import ModalFooter from "src/components/search-modal/ModalFooter";
import ModalTrigger from "src/components/search-modal/ModalTrigger";
import ModalBackdrop from "src/components/search-modal/ModalBackdrop";

export const SearchBar = () => {
    const [index, setIndex] = useState<Document | null>(null);
    const [results, setResults] = useState<SearchDoc[]>([]);
    const [overlayOpen, setOverlayOpen] = useState<boolean>(false);
    const [overlayVisible, setOverlayVisible] = useState<boolean>(false);
    const [overlayQuery, setOverlayQuery] = useState<string>("");
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [indexNotFound, setIndexNotFound] = useState<boolean>(false);
    const modalInputRef = useRef<HTMLInputElement>(null);
    const [screenWidth, setScreenWidth] = useState<number>(window.innerWidth);

    // 📏 Track screen width
    useEffect(() => {
        const handleResize = () => setScreenWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // 🎨 Handle overlay visibility with animation
    useEffect(() => {
        if (overlayOpen) {
            // First make visible immediately
            setOverlayVisible(true);
        } else {
            // When closing, wait for fade out animation before hiding
            const timeout = setTimeout(() => {
                setOverlayVisible(false);
            }, 200); // Match transition duration
            return () => clearTimeout(timeout);
        }
    }, [overlayOpen]);

    // ✅ Load both docs and FlexSearch index
    useEffect(() => {
        const load = async () => {
            try {
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
                console.log("index restored", restored);
                setIndex(restored);
            } catch (err) {
                console.error("❌ Failed to load search index:", err);
                setIndexNotFound(true);
                return;
            }
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
            <ModalTrigger onClick={() => setOverlayOpen(true)} />
            {/* ⚠️ Index not found warning */}
            {indexNotFound && <IndexNotFound onClose={() => setIndexNotFound(false)} />}

            {/* Overlay modal */}
            {overlayVisible && (
                <ModalBackdrop isOpen={overlayOpen} onClick={handleClickOutside}>
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
                                placeholder="Search text in MDX files"
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    fontSize: 16,
                                    borderRadius: 6,
                                    border: "1px solid #ccc",
                                }}
                                onKeyDown={handleModalKeyDown}
                            />
                            <ModalShortcuts screenWidth={screenWidth} />
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
                                            dangerouslySetInnerHTML={{
                                                __html: getResultHighlightSnippet({ content: doc.content, query: overlayQuery, radius: 200 }).slice(0, 200) + "...",
                                            }}
                                        />
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div style={{ fontSize: 14, color: "#888", width: "100%", textAlign: "center", padding: "16px 0" }}>
                                No results found.
                            </div>
                        )}
                        {/* Enchufe y respectos */}
                        <ModalFooter screenWidth={screenWidth} />
                    </div>
                </ModalBackdrop>
            )}
        </>
    );
};