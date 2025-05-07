// SearchBar.tsx
import React, { useEffect, useRef } from "react";

export const SearchBar = () => {
    const isMac =
        navigator.userAgent.includes('macOS') ||
        navigator.userAgent.includes('Mac');
    const hint = isMac ? '⇧⌘K' : 'Ctrl+Shift+K';

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const cmdKey = isMac ? e.metaKey : e.ctrlKey;

            if (cmdKey && e.shiftKey && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    return (
        <div
            style={{
                position: 'relative',
                display: 'inline-block',
            }}
        >
            <input
                ref={inputRef}
                placeholder="Search"
                style={{
                    padding: '4px 8px',
                    paddingRight: '48px',
                    fontSize: 12,
                    height: 28,
                    borderRadius: 4,
                    border: '1px solid #ccc',
                    fontFamily: 'inherit',
                }}
            />
            <span
                style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 11,
                    background: 'transparent',
                    color: '#999',
                    fontFamily: 'monospace',
                    pointerEvents: 'none',
                }}
            >
                {hint}
            </span>
        </div>
    );
};

export const ShortcutHint = ({ keys }: { keys: string }) => {
    return (
        <span
            style={{
                marginLeft: 8,
                padding: '2px 6px',
                borderRadius: 4,
                fontSize: 10,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontFamily: 'monospace',
                color: '#ccc',
            }}
        >
            {keys}
        </span>
    );
};