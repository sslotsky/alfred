import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("alfred-copy-code")
export class AlfredCopyCode extends LitElement {
  @property()
  rawtext: string = "";

  static properties = {
    rawtext: {},
  };

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("click", this.handleClick);
  }

  handleClick = () => {
    navigator.clipboard.writeText(this.rawtext).then(() => {
      this.classList.add("copied");
      setTimeout(() => {
        this.classList.remove("copied");
      }, 3000);
    });
  };

  render() {
    return html`<slot></slot>`;
  }
}
