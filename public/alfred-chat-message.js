
import { LitElement, html, css, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import remarkRehype from 'https://esm.sh/remark-rehype?bundle'
// import rehypeStarryNight from 'https://esm.sh/rehype-starry-night?bundle'
import rehypeStringify from "https://esm.sh/rehype-stringify?bundle";
import remarkParse from "https://esm.sh/remark-parse?bundle";
import { unified } from "https://esm.sh/unified?bundle";

function getMarkdown(content) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkRehype)
    // .use(rehypeStarryNight)
    .use(rehypeStringify);

  return String(processor.processSync(content));
}

export class AlfredChatMessage extends LitElement {
  static styles = css`
    .message {
      display: grid;
      grid-template-columns: 5rem auto;
      width: 100%;
      padding: 0.25rem;
    }

    .message .message-content pre {
      margin-block: 0;
    }

    .message .role {
      font-size: 0;
    }

    .message.user {
      filter: brightness(1.5);
    }

    .message.user .role {
      border: 2px solid var(--text-color);
      width: 2rem;
      text-align: center;
      border-radius: 100%;
      height: 2.25rem;
      padding: 0.25rem;
    }

    .message.user .role::first-letter {
      font-size: 2rem;
      text-transform: capitalize;
    }
  `;

  static properties = {
    message: {},
    role: {},
  };

  constructor() {
    super();
    this.message = '';
  }

  render() {
    return html`
      <div class="message ${this.role}">
        <span class="role">${this.role}&#58;</span>
        <span class="message-content">${unsafeHTML(getMarkdown(this.message))}</span>
      </div>`;
  }
}