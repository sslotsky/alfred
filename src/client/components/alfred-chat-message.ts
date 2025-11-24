import {
  LitElement,
  html,
  css,
  unsafeCSS,
  nothing,
} from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { customElement, property } from "lit/decorators.js";

import { processor } from "../../shared/rehype";

function getSheet(href: string) {
  const sheet = Array.from(document.styleSheets).find(
    (sheet) => sheet.href === href
  );

  const cssText = Array.from(sheet?.cssRules ?? [])
    .filter(
      (rule) => rule.constructor.name !== "CSSImportRule"
    )
    .map((rule) => rule.cssText)
    .join(" ");

  return css`
    ${unsafeCSS(cssText)}
  `;
}

function getMarkdown(content: string) {
  return String(processor.processSync(content));
}

@customElement("alfred-chat-message")
export class AlfredChatMessage extends LitElement {
  static styles = [
    getSheet(
      "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css"
    ),
    getSheet(
      `${location.protocol}//${location.host}/styles.css`
    ),
    css`
      .message.assistant.thinking .role {
        font-size: 2.5rem;
        height: 5rem;
        animation-name: bounce-7;
        animation-timing-function: cubic-bezier(
          0.28,
          0.64,
          0.42,
          1
        );
        animation-duration: 1s;
        animation-iteration-count: infinite;
      }

      @keyframes bounce-7 {
        0% {
          transform: scale(1, 1) translateY(0);
        }
        10% {
          transform: scale(1.1, 0.9) translateY(0);
          filter: invert(0.2);
        }
        30% {
          transform: scale(0.9, 1.1) translateY(30%);
          filter: invert(0.6);
        }
        50% {
          transform: scale(1.05, 0.95) translateY(0);
          filter: invert(1);
        }
        57% {
          transform: scale(1, 1) translateY(-2%);
          filter: invert(0.86);
        }
        64% {
          transform: scale(1, 1) translateY(0);
          filter: invert(0.62);
        }
        100% {
          transform: scale(1, 1) translateY(0);
          filter: invert(0);
        }
      }
    `,
  ];

  @property() message: string = "";
  @property() username: string = "";
  @property() thinking: boolean = false;
  @property() role: string = "";

  render() {
    const leftSide =
      this.role === "user"
        ? this.username
        : this.thinking
        ? "🧠"
        : nothing;
    const content =
      this.thinking && !this.message
        ? html`<span class="ellipse">Thinking</span>`
        : unsafeHTML(getMarkdown(this.message));

    return html` <div
      class="message ${this.role} ${this.thinking
        ? "thinking"
        : ""}"
    >
      <span class="role">${leftSide}</span>
      <span class="message-content">${content}</span>
    </div>`;
  }
}
