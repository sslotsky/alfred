import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";

@customElement("alfred-attach")
export class AlfredAttach extends LitElement {
  static shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  static styles = css`
    input[type="file"] {
      display: none;
    }

    label {
      cursor: pointer;
    }

    label:hover {
      transform: scale(1.05);
      filter: brightness(1.5);
    }
  `;

  @state() ready: boolean = false;

  onChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.dispatchEvent(
        new CustomEvent("alfred-image-selected", {
          detail: { file },
          composed: true,
          bubbles: true,
        })
      );

      input.value = "";
    }
  };

  render() {
    return html`<label
      >📎
      <input
        type="file"
        accept="image/jpeg, image/png, image/webp"
        @input=${this.onChange}
    /></label>`;
  }
}
