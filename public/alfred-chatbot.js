import { LitElement, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

export class AlfredChatbot extends LitElement {
  static properties = {
    message: { state: true }
  };

  constructor() {
    super();
    this.message = '';
  }

  handleSubmit = (e) => {
    this.message = 'Thinking....';
    const text = e.detail.text;
    const thinking = new CustomEvent('alfred-chatbot-thinking');
    document.dispatchEvent(thinking);

    fetch('/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt: text }),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(async res => {
      const stream = res.body.getReader();
      let { done, value } = await stream.read();
      this.message = '';
      while (!done) {
        if (value) {
          this.message += new TextDecoder().decode(value);
        }

        try {
          const next = await stream.read();
          done = next.done;
          value = next.value;
        } catch (e) {
          console.error(e);
          done = true;
        }
      }

      const doneThinking = new CustomEvent('alfred-chatbot-done');
      document.dispatchEvent(doneThinking);
    });
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('alfred-prompt-submitted', this.handleSubmit)
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('alfred-prompt-submitted', this.handleSubmit);
  }

  render() {
    return this.message ? html`<pre style="text-wrap-mode: wrap">${this.message}</pre>` : html`<slot></slot>`;
  }
}