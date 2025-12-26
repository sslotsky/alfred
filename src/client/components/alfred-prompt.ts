import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";

@customElement("alfred-prompt")
export class AlfredPrompt extends LitElement {
  static styles = css`
    .image-container {
      position: relative;
      max-width: fit-content;
    }

    .button-container {
      position: absolute;
      top: 5;
      right: 5;
    }

    .button-container button {
      display: none;
      background-color: #ff4757;
      border-radius: 25%;
      border: none;
      font-size: 0.5rem;
      cursor: pointer;
    }

    .image-container:hover button {
      display: unset;
    }
  `;

  @state() paused: boolean = false;
  @state() preview: ProgressEvent<FileReader> | undefined =
    undefined;

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
      {
        detail: {
          text: child.innerText,
          file: this.preview?.target?.result,
        },
        composed: true,
        bubbles: true,
      }
    );
    document.dispatchEvent(event);
    child.textContent = "";
    this.preview = undefined;
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

    this.addEventListener(
      "alfred-image-selected",
      (e: CustomEventInit<{ file: File }>) => {
        if (e.detail) {
          const reader = new FileReader();
          reader.onload = (e) => {
            this.preview = e;
          };
          reader.readAsDataURL(e.detail.file);
        }
      }
    );
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

  clearPreview = () => {
    this.preview = undefined;
  };

  render() {
    const preview =
      this.preview?.target &&
      html`<div class="image-container">
        <img
          height="50"
          src=${this.preview.target.result}
        />
        <div class="button-container">
          <button @click=${this.clearPreview}>x</button>
        </div>
      </div>`;

    return html`${preview}<slot></slot>`;
  }
}
