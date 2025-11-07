
import { LitElement, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

export class AlfredCopyCode extends LitElement {
  static properties = {
    rawtext: {},
  };

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', this.handleClick);
  }

  handleClick = (e) => {
    navigator.clipboard.writeText(this.rawtext).then(() => {
      this.classList.add('copied');
      setTimeout(() => {
        this.classList.remove('copied');
      }, 3000);
    });
  }

  render() {
    return html`<slot></slot>`;
  }
}