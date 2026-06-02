import { env } from '@neighborhood-showcase/env/server';

export interface CreateTransparentCheckoutInput {
  announcementId: string;
  amountCents: number;
  customerName: string;
  customerEmail: string;
}

export interface TransparentCheckoutResponse {
  billingId: string;
  pixQrCode: string;
  pixCopyPaste: string;
}

export class AbacatePayClient {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.abacatepay.com/v2';

  constructor() {
    this.apiKey = env.ABACATEPAY_API_KEY;
  }

  async createTransparentCheckout(
    input: CreateTransparentCheckoutInput,
  ): Promise<TransparentCheckoutResponse> {
    if (this.apiKey === 'mock-abacatepay-key') {
      // Simulated response for local development/testing to avoid external API calls
      return {
        billingId: `bill_mock_${Math.random().toString(36).substring(2, 9)}`,
        pixQrCode:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADIAQAAAACFI5MzAAABGUlEQVR42u2YSw7DIAxEzYpjcFM+N+UYrErtMUkjpd2WWQQlyudtLI89JpH5a8lDHvJnUkVXmkMPKcMeAg1peo70inrpRbm/ISFDwkhNX4NUSWxEo26WVFKisgc2ArWncSO3OthJvEs0nTju/bOT+NJKzJK++c5OovJWRIob2AwNsf6YXWJ3eFGbgXS4skgEGafaDGSifVONS/ZCQ/Q2YI5l8BdSS0ImwtTezehjiM9C3FG8fbVdykft/URTeEY918hlIZZFC9Yq0Rw6ns63nyxXtkTCYK6VuJv4NKvmMdgFMBHfBbRjb8JFxgoWW04RPmKfEaY2pgcZcT/OsL3GQ5baFrUN23iZZrvJ6pKjDJFXFvL8P3jIfvIGvNX7jsCaJvEAAAAASUVORK5CYII=',
        pixCopyPaste:
          '00020101021226830014br.gov.bcb.pix25610014mock-pix-key52040000530398654042.005802BR5915Mocked Merchant6009Sao Paulo6207050312363040000',
      };
    }

    const payload = {
      method: 'PIX',
      data: {
        amount: input.amountCents,
        description: `Taxa de Publicacao - Anuncio ${input.announcementId}`,
        expiresIn: 600, // 10 minutes
        customer: {
          name: input.customerName,
          email: input.customerEmail,
        },
        metadata: {
          announcementId: input.announcementId,
        },
      },
    };

    const response = await fetch(`${this.baseUrl}/transparents/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AbacatePay API error: ${response.status} - ${errText}`);
    }

    const json = (await response.json()) as {
      success: boolean;
      data?: {
        id: string;
        brCode: string;
        brCodeBase64: string;
      };
      error?: unknown;
    };
    if (!json.success || !json.data) {
      throw new Error(
        `AbacatePay API returned failure: ${JSON.stringify(json.error || json)}`,
      );
    }

    return {
      billingId: json.data.id,
      pixQrCode: json.data.brCodeBase64,
      pixCopyPaste: json.data.brCode,
    };
  }
}
