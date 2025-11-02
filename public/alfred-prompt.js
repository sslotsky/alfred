
import { LitElement, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

export class AlfredPrompt extends LitElement {
  static properties = {
    paused: { state: true }
  };

  constructor() {
    super();
    this.paused = false;
  }

  pause = () => {
    this.paused = true;
  }

  unpause = () => {
    this.paused = false;
  }

  connectedCallback() {
    super.connectedCallback();

    document.addEventListener('alfred-chatbot-thinking', this.pause);
    document.addEventListener('alfred-chatbot-paused', this.unpause);

    this.addEventListener('keyup', e => {
      if (e.key === "Enter" && !e.shiftKey && !this.paused) {
        const child = this.renderRoot.querySelector('slot').assignedElements()[0];
        const event = new CustomEvent('alfred-prompt-submitted', { detail: { text: child.textContent }});
        document.dispatchEvent(event);
        child.textContent = '';
      }
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    document.removeEventListener('alfred-chatbot-thinking', this.pause);
    document.removeEventListener('alfred-chatbot-paused', this.unpause);
  }

  render() {
    return html`<slot></slot>`;
  }
}