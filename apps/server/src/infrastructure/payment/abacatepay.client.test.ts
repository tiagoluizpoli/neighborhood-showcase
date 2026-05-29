import { describe, expect, test } from 'bun:test';
import { AbacatePayClient } from './abacatepay.client';

describe('AbacatePayClient', () => {
  test('returns a mock response when API key is default mock-abacatepay-key', async () => {
    const client = new AbacatePayClient();
    const res = await client.createTransparentCheckout({
      announcementId: 'ann-123',
      amountCents: 200,
      customerName: 'Test Provider',
      customerEmail: 'provider@example.com',
    });

    expect(res).toBeDefined();
    expect(res.billingId).toContain('bill_mock_');
    expect(res.pixQrCode).toContain('data:image/png;base64');
    expect(res.pixCopyPaste).toContain('000201');
  });
});
