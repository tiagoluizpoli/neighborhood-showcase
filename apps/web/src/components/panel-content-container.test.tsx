import { describe, expect, test } from 'bun:test';
import { PanelContentContainer } from './panel-content-container';

describe('PanelContentContainer', () => {
  test('defaults to "default" variant', () => {
    const el = PanelContentContainer({ children: 'content' });
    expect(el.props['data-container-variant']).toBe('default');
  });

  test('renders "default" variant explicitly', () => {
    const el = PanelContentContainer({ variant: 'default', children: 'x' });
    expect(el.props['data-container-variant']).toBe('default');
  });

  test('renders "centered-form" variant', () => {
    const el = PanelContentContainer({
      variant: 'centered-form',
      children: 'x',
    });
    expect(el.props['data-container-variant']).toBe('centered-form');
  });

  test('renders "full-bleed" variant', () => {
    const el = PanelContentContainer({ variant: 'full-bleed', children: 'x' });
    expect(el.props['data-container-variant']).toBe('full-bleed');
  });

  test('passes children through', () => {
    const el = PanelContentContainer({ children: 'hello' });
    expect(el.props.children).toBe('hello');
  });
});
