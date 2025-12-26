import { LitElement, html, nothing } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import {
  customElement,
  property,
  state,
} from "lit/decorators.js";
import { Message } from "ollama";

@customElement("alfred-chatbot")
export class AlfredChatbot extends LitElement {
  @property() name: string = "";
  @state() private messages: Array<Message> = [];
  @state() private incomingMessage: string = "";
  @state() private isEmpty: boolean = false;
  @state() private isThinking: boolean = false;

  addMessage(message: Message) {
    this.messages.push(message);
    this.requestUpdate();
  }

  handleSubmit = async (e: CustomEvent) => {
    const { text, file } = e.detail;
    this.addMessage({ role: "user", content: text });

    const thinking = new CustomEvent(
      "alfred-chatbot-thinking"
    );
    document.dispatchEvent(thinking);
    this.isThinking = true;

    const formData = new FormData();
    formData.append("prompt", text);
    formData.append("type", "image-request");

    if (file) {
      const fileResponse = await fetch(file);
      const blob = await fileResponse.blob();
      formData.append("file", blob);
    }

    fetch("/chat", {
      method: "POST",
      body: formData,
    }).then(async (res) => {
      if (res.redirected) {
        window.location.assign(res.url);
        return;
      }

      if (!res.body) {
        throw new Error("No response body from chat");
      }

      const stream = res.body.getReader();
      let { done, value } = await stream.read();
      this.incomingMessage = "";
      while (!done) {
        if (value) {
          this.incomingMessage += new TextDecoder().decode(
            value
          );
        }

        const next = await stream.read();
        done = next.done;
        value = next.value;
      }

      this.addMessage({
        role: "assistant",
        content: this.incomingMessage,
      });
      this.incomingMessage = "";

      const doneThinking = new CustomEvent(
        "alfred-chatbot-done"
      );
      document.dispatchEvent(doneThinking);
      this.isThinking = false;
    });
  };

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener(
      "alfred-prompt-submitted",
      this.handleSubmit
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener(
      "alfred-prompt-submitted",
      this.handleSubmit
    );
  }

  updated() {
    const slotChildren = this.renderRoot
      ?.querySelector("slot")
      ?.assignedElements();
    this.isEmpty =
      slotChildren?.length === 0 &&
      this.messages.length === 0;
  }

  render() {
    const messageHtml = this.messages.map((m) => {
      return html`<alfred-chat-message
        role="${m.role}"
        message="${m.content}"
        username=${this.name}
      ></alfred-chat-message>`;
    });

    const lastMessage = {
      role: "assistant",
      content: this.incomingMessage,
    };
    const response = html`
      <alfred-chat-message
        thinking=${ifDefined(this.isThinking || undefined)}
        role="${lastMessage.role}"
        message=${lastMessage.content}
      ></alfred-chat-message>
    `;

    const userPrompt = this.isEmpty
      ? `Hello ${this.name}! Please, ask me a question!`
      : nothing;

    return html`
      <slot></slot>
      ${userPrompt} ${messageHtml} ${response}
    `;
  }
}
