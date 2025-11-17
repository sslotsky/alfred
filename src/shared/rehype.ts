import { isElement } from "hast-util-is-element";
import { toText } from "hast-util-to-text";

import highlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";

export const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(highlight)
  .use(() => (tree) => {
    visit(tree, ["element"], (node) => {
      if (isElement(node, "a")) {
        node.properties["target"] = "_blank";
      }

      if (!isElement(node, "pre")) {
        return;
      }

      const code = node.children[0];
      if (!isElement(code, "code")) {
        return;
      }

      node.children.push({
        tagName: "alfred-copy-code",
        properties: {
          rawText: toText(code, {
            // @ts-ignore
            whitespace: "preserve",
          }),
        },
        type: "element",
        children: [],
      });
    });
  })
  .use(rehypeStringify);
