import path from 'path';
import fs from 'fs/promises';
import { generateDocs } from './generateDocs';
import { ExtractionConfig } from '../types/index';
import { Index } from 'flexsearch';

export interface SearchDoc {
    id: string;
    content: string;
    sourcePath: string;
}

export async function buildTextIndex(config: ExtractionConfig) {
    const docs = await generateDocs(config.inputPaths);
    const index = new Index({ tokenize: 'forward', preset: 'match' });

    for (const doc of docs) {
        index.add(doc.id, doc.content);
    }

    if (config.outputJson) {
        const outputDir = path.resolve(process.cwd(), 'text-search-artifacts');
        const outputFile = path.join(outputDir, 'text-search-debug.json');
        await fs.mkdir(outputDir, { recursive: true });
        await fs.writeFile(outputFile, JSON.stringify(docs, null, 2));
    }

    return { docs, index };
}