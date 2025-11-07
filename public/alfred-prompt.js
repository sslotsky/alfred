
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

  getSlotContent() {
    return this.renderRoot.querySelector('slot').assignedElements()[0];
  }

  submitPrompt() {
    const child = this.getSlotContent();
    const event = new CustomEvent('alfred-prompt-submitted', { detail: { text: child.innerText }});
    document.dispatchEvent(event);
    child.textContent = '';
  }

  connectedCallback() {
    super.connectedCallback();

    document.addEventListener('alfred-chatbot-thinking', this.pause);
    document.addEventListener('alfred-chatbot-done', this.unpause);

    this.addEventListener('keyup', e => {
      if (e.key === "Enter" && !e.shiftKey && !this.paused) {
        this.submitPrompt();
      }
    });

    this.addEventListener('click', e => {
      if (e.target.tagName === 'BUTTON') {
        this.submitPrompt();
      }
    })
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    document.removeEventListener('alfred-chatbot-thinking', this.pause);
    document.removeEventListener('alfred-chatbot-done', this.unpause);
  }

  render() {
    return html`<slot></slot>`;
  }
}