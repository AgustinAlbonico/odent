import { Injectable } from '@nestjs/common';
import type { WhatsAppButton } from './whatsapp.types.js';

@Injectable()
export class WhatsAppService {
  private readonly baseUrl: string;
  private readonly sessionName: string;

  constructor() {
    this.baseUrl = process.env.WAHA_BASE_URL || 'http://localhost:3000';
    this.sessionName = process.env.WAHA_SESSION_NAME || 'default';
  }

  async sendText(phoneNumber: string, text: string): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      await fetch(`${this.baseUrl}/api/sendText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: `${phoneNumber}@c.us`, text, session: this.sessionName }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch (error) {
      console.error('[WhatsApp] Error sending text message:', error);
    }
  }

  async sendButtons(
    phoneNumber: string,
    text: string,
    buttons: WhatsAppButton[],
  ): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      await fetch(`${this.baseUrl}/api/sendButtons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: `${phoneNumber}@c.us`,
          text,
          buttons,
          session: this.sessionName,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch (error) {
      console.error('[WhatsApp] Error sending buttons message:', error);
    }
  }
}
