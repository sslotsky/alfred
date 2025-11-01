import { LitElement, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

export class AlfredChatbot extends LitElement {
  static properties = {
    message: { state: true }
  };

  constructor() {
    super();
    this.message = '';
  }

  connectedCallback() {
    super.connectedCallback();
    fetch('/chat').then(async res => {
      const stream = res.body.getReader();
      let { done, value } = await stream.read();
      while (!done) {
        if (value) {
          this.message += new TextDecoder().decode(value);
        }

        const next = await stream.read();
        done = next.done;
        value = next.value;
      }
    });
  }

  render() {
    return this.message ? html`<pre style="text-wrap-mode: wrap">${this.message}</pre>` : html`<slot></slot>`;
  }
}