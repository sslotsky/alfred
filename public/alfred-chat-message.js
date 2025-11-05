
import { LitElement, html, css } from 'lit';
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

    .message.assistant.thinking .role {
      font-size: 2.5rem;
      height: 5rem;
      animation-name: bounce-7;
      animation-timing-function: cubic-bezier(0.280, 0.640, 0.420, 1);
      animation-duration: 1s;
      animation-iteration-count: infinite;
    }

    @keyframes bounce-7 {
      0%   { transform: scale(1,1)      translateY(0); }
      10%  { transform: scale(1.1,.9)   translateY(0); }
      30%  { transform: scale(.9,1.1)   translateY(30%); }
      50%  { transform: scale(1.05,.95) translateY(0); }
      57%  { transform: scale(1,1)      translateY(-2%); }
      64%  { transform: scale(1,1)      translateY(0); }
      100% { transform: scale(1,1)      translateY(0); }
    }
  `;

  static properties = {
    message: {},
    role: {},
    thinking: {},
  };

  constructor() {
    super();
    this.message = '';
    this.thinking = false;
  }


  render() {
    const leftSide = this.thinking && this.role === 'assistant' ? '🧠' : '👨🏽‍💻';

    return html`
      <div class="message ${this.role} ${this.thinking ? 'thinking' : ''}">
        <span class="role">${leftSide}</span>
        <span class="message-content">${unsafeHTML(getMarkdown(this.message))}</span>
      </div>`;
  }
}