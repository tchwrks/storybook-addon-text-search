import React, { useEffect, useRef, useState } from "react";
import { SearchDoc } from "src/textsearch/search/buildTextIndex";

export const SearchBar = () => {
    const [docs, setDocs] = useState<SearchDoc[]>([]);
    const [overlayOpen, setOverlayOpen] = useState(false);
    const [overlayQuery, setOverlayQuery] = useState("");
    const modalInputRef = useRef<HTMLInputElement>(null);

    // Load index once
    useEffect(() => {
        fetch("text-search-debug.json")
            .then((res) => res.json())
            .then(setDocs)
            .catch((err) => console.error("❌ Failed to fetch index:", err));
    }, []);

    // Keyboard shortcut
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

    const results =
        overlayQuery.length > 1
            ? docs.filter((doc) =>
                doc.content.toLowerCase().includes(overlayQuery.toLowerCase())
            )
            : [];

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
                                    >
                                        <strong style={{ fontSize: 14 }}>
                                            {doc.id}
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