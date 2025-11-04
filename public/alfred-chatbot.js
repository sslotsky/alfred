import { LitElement, html, css, nothing } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

export class AlfredChatbot extends LitElement {
    static styles = css`
      .message {
        display: grid;
        grid-template-columns: 5rem auto;
        width: 100%;
        padding: 0.25rem;
      }
  `;

  static properties = {
    messages: { state: true },
    incomingMessage: { state: true },
    isEmpty: { state: true },
  };

  constructor() {
    super();
    this.messages = [];
    this.incomingMessage = '';
    this.isEmpty = false;
  }

  addMessage(message) {
    this.messages.push(message);
    this.requestUpdate();
  }
  handleSubmit = (e) => {
    const text = e.detail.text;
    this.addMessage({ role: 'user', content: text })


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
      this.incomingMessage = '';
      while (!done) {
        if (value) {
          this.incomingMessage += new TextDecoder().decode(value);
        }

        const next = await stream.read();
        done = next.done;
        value = next.value;
      }

      this.addMessage({ role: 'assistant', content: this.incomingMessage })
      this.incomingMessage = '';

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

  updated() {
    const slotChildren = this.renderRoot.querySelector('slot').assignedElements();
    this.isEmpty = slotChildren.length === 0 && this.messages.length === 0;
  }

  render() {
    const messageHtml = this.messages.map(m => {
      return html`<div class="message"><span>${m.role}&#58;</span><span>${m.content}</span></div>`
    });

    const lastMessageIsUser = this.messages[this.messages.length - 1]?.role === "user";

    return html`
      <slot @slotchange=${this.handleSlotChange}></slot>
      ${this.isEmpty ? "Ask me a question!" : nothing}
      ${messageHtml}
      ${lastMessageIsUser ? html`
        <div class="message">
          <span>assistant&#58;</span><span>${this.incomingMessage}</span>
        </div>
      ` : nothing}
    `
  }
}