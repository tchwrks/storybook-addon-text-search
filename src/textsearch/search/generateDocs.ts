import FastGlob from 'fast-glob';
import fs from 'fs/promises';
import path from 'path';
import { extractTextFromMdx } from '../extract/extractFromMdx';
import { extractComponentMetadata } from 'src/textsearch/extract/extractComponentMetadata';
import type { SearchDoc } from './buildTextIndex';

export async function generateDocs(inputPaths: string | string[]): Promise<SearchDoc[]> {
    const files = await FastGlob(inputPaths, {
        absolute: true,
        onlyFiles: true,
        ignore: ["**/node_modules/**", "**/dist/**"],
    });
    const docs: SearchDoc[] = [];

    for (const fullPath of files) {
        const extracted = await extractTextFromMdx(fullPath);
        let content = extracted.join(' ');

        if (fullPath.endsWith('.stories.tsx') || fullPath.endsWith('.stories.js')) {
            try {
                const meta = await extractComponentMetadata(fullPath);

                if (meta?.summary) content += ` ${meta.summary}`;

                if (meta?.props) {
                    content += ' ' + meta.props
                        .map(p => `${p.name} ${p.description ?? ''}`)
                        .join(' ');
                }
            } catch (err) {
                console.warn(`⚠️ Failed to parse component metadata for ${fullPath}`, err);
            }
        }

        docs.push({
            id: path.relative(process.cwd(), fullPath).replace(/\.[^/.]+$/, ''),
            content,
            sourcePath: fullPath,
        });
    }

    return docs;
}