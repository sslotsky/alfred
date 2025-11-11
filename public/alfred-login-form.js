
import { LitElement, html, nothing } from 'lit';

export class AlfredLoginForm extends LitElement {
  static properties = {
    sent: { state: true },
    doneMessage: {},
  };

  constructor() {
    super();
    this.sent = false;
    this.doneMessage = 'Done';
  }

  getFormElement() {
    return this.renderRoot.querySelector('slot')?.assignedElements().find(e => e.tagName === 'FORM');
  }

  handleSubmit = (e) => {
    e.preventDefault();
    const d = new FormData(e.target);
    const form = this.getFormElement();
    if (form) {
      form.classList.add('thinking');
      const submit = form.querySelector('input[type="submit"');
      if (submit) {
        submit.disabled = true;
      }
    }

    fetch('/login', {
      method: 'POST',
      body: d
    }).then(() => {
      this.sent = true;
    }).catch(e => {
      console.error('Magic link failed', e);
      submit.disabled = false;
    })
  }

  handleSlotChange = () => {
    const slot = this.renderRoot.querySelector('slot');
    const form = slot?.assignedElements().find(e => e.tagName === 'FORM');

    if (!form) {
      return;
    }

    if (this.form && form !== this.form) {
      this.form.removeEventListener('submit', this.handleSubmit);
    }

    this.form = form;
    this.form.addEventListener('submit', this.handleSubmit);
  }

  render() {
    if (this.sent) {
      return html`<h2>${this.doneMessage}</h2>`;
    }

    return html`<slot @slotchange=${this.handleSlotChange}></slot>`;
  }
}