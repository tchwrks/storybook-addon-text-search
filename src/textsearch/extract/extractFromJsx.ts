import { visit } from 'unist-util-visit';
import type { NormalizedExtractionRule } from '../utils/normalizeRule';

export function extractFromJsx(node: any, rule: NormalizedExtractionRule): string[] {
    const results: string[] = [];

    // Handle custom extractor
    if (rule.extractor) {
        return rule.extractor(node);
    }

    // Extract from props
    for (const propName of rule.props) {
        const attr = node.attributes?.find((a: any) => a.name === propName);
        if (attr?.type === 'mdxJsxAttribute' && typeof attr.value === 'string') {
            results.push(attr.value);
        }
    }

    // Extract from children (optionally filtered by nestedTextSelectors)
    if (rule.children && Array.isArray(node.children)) {
        visit(node, 'text', (child: any, _index, parent: any) => {
            if (
                rule.nestedTextSelectors.length === 0 ||
                (rule.nestedTextSelectors.includes(parent?.name))
            ) {
                results.push(child.value);
            }
        });
    }

    return results;
}