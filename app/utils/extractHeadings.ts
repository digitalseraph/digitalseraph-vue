export interface Heading {
  id: string;
  text: string;
  depth: 2 | 3;
}

interface AstNode {
  type?: string;
  tag?: string;
  props?: Record<string, unknown>;
  children?: AstNode[];
  value?: string;
}

function nodeText(node: AstNode): string {
  if (node.value) return node.value;
  if (node.children) return node.children.map(nodeText).join("");
  return "";
}

/**
 * Walk a Nuxt Content AST and return a flat list of h2/h3 headings for TOC rendering.
 * h1 is intentionally excluded — the page title renders the h1 separately.
 */
export function extractHeadings(body: unknown): Heading[] {
  const out: Heading[] = [];
  if (!body || typeof body !== "object") return out;
  const root = body as AstNode;

  function walk(node: AstNode) {
    if (node.tag === "h2" || node.tag === "h3") {
      const id = (node.props?.id as string) ?? "";
      const text = nodeText(node).trim();
      if (id && text) {
        out.push({ id, text, depth: node.tag === "h2" ? 2 : 3 });
      }
    }
    if (node.children) {
      for (const child of node.children) walk(child);
    }
  }

  walk(root);
  return out;
}
