import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";

@customElement("alfred-prompt")
export class AlfredPrompt extends LitElement {
  @state() paused: boolean = false;

  pause = () => {
    this.paused = true;
  };

  unpause = () => {
    this.paused = false;
  };

  getSlotContent() {
    const el = this.renderRoot
      ?.querySelector("slot")
      ?.assignedElements()[0];
    if (el) {
      return el as HTMLSpanElement;
    }

    return null;
  }

  submitPrompt() {
    const child = this.getSlotContent();
    if (!child) {
      return;
    }

    const event = new CustomEvent(
      "alfred-prompt-submitted",
      { detail: { text: child.innerText } }
    );
    document.dispatchEvent(event);
    child.textContent = "";
  }

  connectedCallback() {
    super.connectedCallback();

    document.addEventListener(
      "alfred-chatbot-thinking",
      this.pause
    );
    document.addEventListener(
      "alfred-chatbot-done",
      this.unpause
    );

    this.addEventListener("keyup", (e) => {
      if (
        e.key === "Enter" &&
        !e.shiftKey &&
        !this.paused
      ) {
        this.submitPrompt();
      }
    });

    this.addEventListener("click", (e: PointerEvent) => {
      if (!e.target) {
        return;
      }

      if (
        (e.target as HTMLButtonElement).tagName === "BUTTON"
      ) {
        this.submitPrompt();
      }
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    document.removeEventListener(
      "alfred-chatbot-thinking",
      this.pause
    );
    document.removeEventListener(
      "alfred-chatbot-done",
      this.unpause
    );
  }

  render() {
    return html`<slot></slot>`;
  }
}
