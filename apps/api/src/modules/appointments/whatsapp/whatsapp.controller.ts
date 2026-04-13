import { Body, Controller, Headers, HttpCode, HttpStatus, Post, UnauthorizedException } from '@nestjs/common';
import { BotStateMachine } from './bot-statemachine.js';

@Controller('webhooks/whatsapp')
export class WhatsAppWebhookController {
  constructor(
    private readonly botStateMachine: BotStateMachine,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() body: unknown,
    @Headers('x-webhook-token') token?: string,
  ): Promise<{ status: string }> {
    const expectedToken = process.env.WAHA_WEBHOOK_TOKEN;

    if (expectedToken && token !== expectedToken) {
      throw new UnauthorizedException('Invalid webhook token');
    }

    if (!body || typeof body !== 'object') {
      return { status: 'ignored' };
    }

    const payload = body as Record<string, unknown>;
    const innerPayload = payload.payload as Record<string, unknown> | undefined;

    if (!innerPayload) {
      return { status: 'ignored' };
    }

    const from = (innerPayload.from as string) ?? '';
    const bodyText = (innerPayload.body as string) ?? '';
    const timestamp = Number(innerPayload.timestamp ?? Date.now());

    if (!from || !bodyText) {
      return { status: 'ignored' };
    }

    const cleanPhone = from.replace('@c.us', '').replace('@s.whatsapp.net', '');

    // Tenant is resolved by phone lookup in bot-statemachine
    const tenantId = process.env.DEFAULT_TENANT_ID || '';

    await this.botStateMachine.handleMessage(cleanPhone, bodyText, tenantId);

    return { status: 'ok' };
  }
}
