import FastGlob from 'fast-glob';
import path from 'path';
import { extractTextFromMdx } from 'src/textsearch/extract/extractFromMdx';
import { extractComponentMetadata } from 'src/textsearch/extract/extractComponentMetadata';
import type { SearchDoc } from './buildTextIndex';

export async function generateDocs(inputPaths: string | string[]): Promise<SearchDoc[]> {
    const files = await FastGlob(inputPaths, {
        absolute: true,
        onlyFiles: true,
        ignore: ["**/node_modules/**", "**/dist/**"]
    });

    const docs: SearchDoc[] = [];

    for (const fullPath of files) {
        const { text, metaTitle } = await extractTextFromMdx(fullPath);
        let content = text.join(" ");

        if (fullPath.endsWith(".stories.tsx") || fullPath.endsWith(".stories.js")) {
            try {
                const meta = await extractComponentMetadata(fullPath);

                if (meta?.summary) content += ` ${meta.summary}`;

                if (meta?.props) {
                    content += " " + meta.props.map(p => `${p.name} ${p.description ?? ""}`).join(" ");
                }
            } catch (err) {
                console.warn(`⚠️ Failed to parse component metadata for ${fullPath}`, err);
            }
        }

        const relativePath = path.relative(process.cwd(), fullPath);
        const fileName = path.basename(fullPath).replace(/\.[^/.]+$/, '');

        docs.push({
            id: relativePath.replace(/\.[^/.]+$/, ''),
            title: fileName,
            content,
            snippet: content.slice(0, 150).replace(/\s+/g, " ") + "…",
            sourcePath: fullPath,
            metaTitle,
            type: fullPath.endsWith(".mdx")
                ? "mdx"
                : fullPath.includes(".stories")
                    ? "story"
                    : "other"
        });
    }

    return docs;
}