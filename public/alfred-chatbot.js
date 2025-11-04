import { LitElement, html, nothing } from 'lit';

export class AlfredChatbot extends LitElement {
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
    const messageHtml = this.messages.map((m) => {
      return html`<alfred-chat-message role="${m.role}" message="${m.content}"></alfred-chat-message>`;
    });

    const lastMessage = { role: "assistant", content: this.incomingMessage };
    const response = html`
      <alfred-chat-message role="${lastMessage.role}" message=${lastMessage.content}></alfred-chat-message>
    `;

    return html`
      <slot @slotchange=${this.handleSlotChange}></slot>
      ${this.isEmpty ? "Ask me a question!" : nothing}
      ${messageHtml}
      ${response}
    `;
  }
}