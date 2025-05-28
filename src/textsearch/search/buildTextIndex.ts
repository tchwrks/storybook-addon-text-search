import path from 'path';
import fs from 'fs/promises';
import { generateDocs } from './generateDocs';
import { ExtractionConfig } from '../types/index';
import { Document } from 'flexsearch';

export interface SearchDoc {
    id: string;
    title: string;
    content: string;
    metaTitle?: string;
    snippet?: string;
    sourcePath: string;
    type?: 'mdx' | 'story' | 'other';
    [key: string]: string | undefined;
}

export async function buildTextIndex(config: ExtractionConfig) {
    const docs: SearchDoc[] = await generateDocs(config.inputPaths);

    const index = new Document({
        tokenize: "forward",
        document: {
            id: 'id',
            index: ['title', 'content'],
            store: ['id', 'title', 'content', 'snippet', 'sourcePath', 'type', 'metaTitle']
        }
    });

    for (const doc of docs) {
        index.add(doc);
    }

    if (config.outputJson) {
        const outputDir = path.resolve(process.cwd(), '.text-search-artifacts');
        await fs.mkdir(outputDir, { recursive: true });

        await fs.writeFile(
            path.join(outputDir, 'text-search-docs.json'),
            JSON.stringify(docs, null, 2)
        );

        const serializedIndex: Record<string, string> = {};

        await new Promise<void>((resolve) => {
            index.export((key, data) => {
                serializedIndex[key] = data;
                // No need to wait; FlexSearch calls export() sync unless you're async
            });
            resolve(); // ✅ once the synchronous loop ends
        });

        await fs.writeFile(
            path.join(outputDir, 'text-search-index.json'),
            JSON.stringify(serializedIndex, null, 2)
        );
    }

    return { docs, index };
}