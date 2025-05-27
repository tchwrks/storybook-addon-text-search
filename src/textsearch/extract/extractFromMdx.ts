import fs from 'fs/promises';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { extractFromJsx } from './extractFromJsx';
import { normalizeRule } from '../utils/normalizeRule';
import config from '../../../textsearch.config';

export interface ExtractedMdxData {
    text: string[];
    metaTitle: string | undefined;
}

export async function extractTextFromMdx(filePath: string): Promise<ExtractedMdxData> {
    const fileContent = await fs.readFile(filePath, 'utf-8');

    const extractedTree = unified()
        .use(remarkParse)
        .use(remarkMdx)
        .parse(fileContent);

    const textNodes: string[] = [];
    let metaTitle: string | undefined = undefined;

    visit(extractedTree, (node) => {
        if (node.type === 'text') {
            textNodes.push(node.value);
        }

        if (
            (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') &&
            typeof node.name === 'string'
        ) {

            if (node.name === "Meta" && Array.isArray(node.attributes)) {
                const titleAttr = node.attributes.find(
                    (attr) => attr.type === "mdxJsxAttribute" && attr.name === "title"
                );

                if (titleAttr && typeof titleAttr.value === "string") {
                    metaTitle = titleAttr.value;
                }
            }
            const rule = config.jsxTextMap?.[node.name];
            if (rule) {
                const normalized = normalizeRule(rule);
                const jsxTexts = extractFromJsx(node, normalized);
                textNodes.push(...jsxTexts);
            }
        }
    });

    return {
        text: [...new Set(textNodes)],
        metaTitle,
    };
}