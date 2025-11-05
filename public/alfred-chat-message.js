
import { LitElement, html, css, unsafeCSS, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import remarkRehype from 'https://esm.sh/remark-rehype?bundle'
// import rehypeStarryNight from 'https://esm.sh/rehype-starry-night?bundle'
import highlight from 'https://esm.sh/rehype-highlight?bundle';
import rehypeStringify from "https://esm.sh/rehype-stringify?bundle";
import remarkParse from "https://esm.sh/remark-parse?bundle";
import { unified } from "https://esm.sh/unified?bundle";

function getSheet(href) {
  const sheet = Array.from(document.styleSheets)
    .find(sheet => sheet.href === href);

  const cssText = Array.from(sheet.cssRules)
    .filter(rule => rule.constructor.name !== "CSSImportRule")
    .map(rule => rule.cssText)
    .join(" ");
    
  return css`${unsafeCSS(cssText)}`;
}

function getMarkdown(content) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(highlight)
    .use(rehypeStringify);

  return String(processor.processSync(content));
}

export class AlfredChatMessage extends LitElement {
  static styles = [
  getSheet("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css"),
  getSheet(`${location.protocol}//${location.host}/styles.css`),
  css`
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
  `];

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
    const leftSide = this.role === 'user' ? '👨🏽‍💻' : this.thinking ? '🧠' : nothing;

    return html`
      <div class="message ${this.role} ${this.thinking ? 'thinking' : ''}">
        <span class="role">${leftSide}</span>
        <span class="message-content">${unsafeHTML(getMarkdown(this.message))}</span>
      </div>`;
  }
}