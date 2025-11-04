
import { LitElement, html, css, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { Task } from '@lit/task';


import remarkRehype from 'https://esm.sh/remark-rehype?bundle'
import rehypeStarryNight from 'https://esm.sh/rehype-starry-night?bundle'
import rehypeStringify from "https://esm.sh/rehype-stringify?bundle";
import remarkParse from "https://esm.sh/remark-parse?bundle";
import { unified } from "https://esm.sh/unified?bundle";

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

  messageTask = new Task(this, {
    task: async ([message, role]) => {
      const processor = unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(rehypeStarryNight)
        .use(rehypeStringify);

      const content = String(await processor.process(message));

      return [content, role]

    },
    args: () => [this.message, this.role]
  });

  incomplete() {
    return html`
      <div class="message">
        <span class="role"></span>
        <span class="message-content"></span>
      </div>
    `;
  }


  render() {
    return html`
      ${this.messageTask.render({
        initial: this.incomplete,
        pending: this.incomplete,
        complete: ([message, role]) => {
          return html`
            <div class="message ${role}">
              <span class="role">${role}&#58;</span>
              <span class="message-content">${unsafeHTML(message)}</span>
            </div>`;
        }
      })}`;
  }
}