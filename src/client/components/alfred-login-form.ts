import { LitElement, html } from "lit";
import {
  customElement,
  property,
  state,
} from "lit/decorators.js";

@customElement("alfred-login-form")
export class AlfredLoginForm extends LitElement {
  @state() sent: boolean = false;
  @property() doneMessage: string = "";

  private form: HTMLFormElement | undefined = undefined;

  getFormElement() {
    return this.renderRoot
      .querySelector("slot")
      ?.assignedElements()
      .find((e) => e.tagName === "FORM");
  }

  handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    if (!e.target) {
      return;
    }

    const d = new FormData(e.target as HTMLFormElement);
    const form = this.getFormElement();
    if (form) {
      form.classList.add("thinking");
      const submit = form.querySelector<HTMLInputElement>(
        'input[type="submit"'
      );

      if (submit) {
        submit.disabled = true;
      }

      fetch("/login", {
        method: "POST",
        body: d,
      })
        .then(() => {
          this.sent = true;
        })
        .catch((e) => {
          console.error("Magic link failed", e);
          if (submit) {
            submit.disabled = false;
          }
        });
    }
  };

  handleSlotChange = () => {
    const slot = this.renderRoot.querySelector("slot");
    const form = slot
      ?.assignedElements()
      .find((e) => e.tagName === "FORM");

    if (!form) {
      return;
    }

    if (this.form && form !== this.form) {
      this.form.removeEventListener(
        "submit",
        this.handleSubmit
      );
    }

    this.form = form as HTMLFormElement;
    this.form.addEventListener("submit", this.handleSubmit);
  };

  render() {
    if (this.sent) {
      return html`<h2>${this.doneMessage}</h2>`;
    }

    return html`<slot
      @slotchange=${this.handleSlotChange}
    ></slot>`;
  }
}
