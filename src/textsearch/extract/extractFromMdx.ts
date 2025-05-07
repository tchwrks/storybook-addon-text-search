import fs from 'fs/promises';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { extractFromJsx } from './extractFromJsx';
import { normalizeRule } from '../utils/normalizeRule';
import config from '../../../textsearch.config';

export async function extractTextFromMdx(filePath: string): Promise<string[]> {
    const fileContent = await fs.readFile(filePath, 'utf-8');

    const extractedTree = unified()
        .use(remarkParse)
        .use(remarkMdx)
        .parse(fileContent);

    const textNodes: string[] = [];

    visit(extractedTree, (node) => {
        if (node.type === 'text') {
            textNodes.push(node.value);
        }

        if (
            (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') &&
            typeof node.name === 'string'
        ) {
            const rule = config.jsxTextMap?.[node.name];
            if (rule) {
                const normalized = normalizeRule(rule);
                const jsxTexts = extractFromJsx(node, normalized);
                textNodes.push(...jsxTexts);
            }
        }
    });

    return [...new Set(textNodes)];
}