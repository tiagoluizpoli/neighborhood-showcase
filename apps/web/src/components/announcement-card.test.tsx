// biome-ignore-all lint/suspicious/noExplicitAny: test harness mocks browser/react internals
import { beforeEach, describe, expect, mock, test } from 'bun:test';
import * as RealReact from 'react';

let hookIndex = 0;
const hookState: any[] = [];
const activeEffects: (() => void)[] = [];

global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  innerWidth: 1280,
  location: { pathname: '/' },
  history: { pushState: () => {} },
} as any;

const resetHookState = () => {
  hookIndex = 0;
  hookState.length = 0;
  activeEffects.length = 0;
};

const renderComponent = (Component: () => any) => {
  hookIndex = 0;
  activeEffects.length = 0;
  const result = Component();
  for (const effect of activeEffects) {
    effect();
  }
  return result;
};

const getNodeText = (node: any): string => {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join('');
  return getNodeText(node.props?.children);
};

const findNodeByText = (node: any, text: string): any | null => {
  if (node == null || typeof node === 'boolean') return null;
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node).includes(text) ? node : null;
  }
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findNodeByText(child, text);
      if (match) return match;
    }
    return null;
  }

  if (getNodeText(node.props?.children).includes(text)) {
    return node;
  }

  return findNodeByText(node.props?.children, text);
};

const findNodeByProp = (node: any, propName: string, propValue: string) => {
  if (node == null || typeof node === 'boolean') return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findNodeByProp(child, propName, propValue);
      if (match) return match;
    }
    return null;
  }
  if (node.props?.[propName] === propValue) return node;
  return findNodeByProp(node.props?.children, propName, propValue);
};

const mockNavigate = mock(() => {});
mock.module('@tanstack/react-router', () => ({
  Link: (props: any) => {
    const { children, ...rest } = props;
    return <a {...rest}>{children}</a>;
  },
  useNavigate: () => mockNavigate,
}));

mock.module('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'location.ip_fallback': 'Região aproximada',
        'location.selected_condo': 'Condomínio selecionado',
        'location.fresh_gps': 'Localização atual (GPS)',
      };
      let val = translations[key] ?? key;
      if (options?.name) {
        val = val.replace('{{name}}', options.name);
      }
      return val;
    },
  }),
}));

mock.module('react', () => ({
  ...RealReact,
  useCallback: (fn: any) => fn,
  useEffect: (callback: () => void) => {
    activeEffects.push(callback);
  },
  useRef: (initialValue: any) => {
    const idx = hookIndex++;
    if (hookState[idx] === undefined) {
      hookState[idx] = { current: initialValue };
    }
    return hookState[idx];
  },
  useState: (initialValue: any) => {
    const idx = hookIndex++;
    if (hookState[idx] === undefined) {
      const stateContainer = {
        value:
          typeof initialValue === 'function' ? initialValue() : initialValue,
        setValue: (newVal: any) => {
          stateContainer.value =
            typeof newVal === 'function'
              ? newVal(stateContainer.value)
              : newVal;
          hookState[idx][0] = stateContainer.value;
        },
      };
      hookState[idx] = [stateContainer.value, stateContainer.setValue];
    }
    return hookState[idx];
  },
}));

import { AnnouncementCard } from './announcement-card';

describe('AnnouncementCard', () => {
  beforeEach(() => {
    resetHookState();
    mockNavigate.mockClear();
  });

  const mockAd = {
    id: 'ann-123',
    providerId: 'prov-456',
    condominiumId: 'condo-789',
    condoName: 'Condominio Central',
    condoCity: 'Florianópolis',
    condoState: 'SC',
    condoNeighborhood: 'Centro',
    title: 'Awesome Pizza Delivery',
    subtitle: 'Best artisan pizza in town',
    description: 'We deliver fresh and delicious pizza directly to your door.',
    priceCents: 4500, // R$ 45,00
    imageUrl: 'pizza.jpg',
    category: 'Alimentação',
    categoryId: 'cat-1',
    tags: [],
    contactLinks: {
      whatsapp: '5548999999999',
      phone: '4833333333',
      email: 'pizza@test.com',
    },
    showVerifiedBadge: true,
    status: 'ACTIVE',
    createdAt: new Date(),
    providerName: 'John Pizza',
    providerAvatarUrl: 'avatar.jpg',
  };

  test('renders basic card content', () => {
    const tree = renderComponent(() => AnnouncementCard({ ad: mockAd }));
    expect(findNodeByText(tree, 'Awesome Pizza Delivery')).toBeTruthy();
    expect(findNodeByText(tree, 'Best artisan pizza in town')).toBeTruthy();
    expect(findNodeByText(tree, '45,00')).toBeTruthy();
    expect(findNodeByText(tree, 'John Pizza')).toBeTruthy();
  });

  test('navigates to detail page on card click', () => {
    const tree = renderComponent(() => AnnouncementCard({ ad: mockAd }));
    tree.props.onClick({ stopPropagation: () => {} });
    expect(mockNavigate).toHaveBeenCalled();
  });

  test('does not navigate to detail page when clicking contact button', () => {
    const mockContactClick = mock(() => {});
    const tree = renderComponent(() =>
      AnnouncementCard({ ad: mockAd, onContactClick: mockContactClick }),
    );
    const whatsappLink = findNodeByProp(
      tree,
      'href',
      'https://wa.me/5548999999999',
    );
    expect(whatsappLink).toBeTruthy();

    const stopPropagationMock = mock(() => {});
    whatsappLink.props.onClick({ stopPropagation: stopPropagationMock });
    expect(stopPropagationMock).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockContactClick).toHaveBeenCalled();
  });

  test('shows verified badge near provider name', () => {
    const tree = renderComponent(() => AnnouncementCard({ ad: mockAd }));
    const providerLink = findNodeByProp(tree, 'href', '/prestadores/prov-456');
    expect(providerLink).toBeTruthy();
    const checkIcon = findNodeByProp(
      providerLink,
      'className',
      'h-3.5 w-3.5 shrink-0 fill-current text-primary',
    );
    expect(checkIcon).toBeTruthy();
  });

  test('displays correct location/proximity text based on confidence rules', () => {
    // 1. Confirmed condominium
    const treeCondo = renderComponent(() =>
      AnnouncementCard({
        ad: mockAd,
        selectedCondo: { id: 'condo-789', name: 'Condominio Central' },
      }),
    );
    expect(findNodeByText(treeCondo, 'No seu condomínio')).toBeTruthy();

    // 2. Fresh GPS (approximate distance shown)
    const adWithCoords = {
      ...mockAd,
      latitude: '-27.5969',
      longitude: '-48.5495',
    };
    const treeGps = renderComponent(() =>
      AnnouncementCard({
        ad: adWithCoords,
        visitorCoords: { latitude: -27.5969, longitude: -48.5495 },
        isGpsFresh: true,
      }),
    );
    expect(findNodeByText(treeGps, 'A 0.0 km')).toBeTruthy();

    // 3. Stored GPS while refreshing/stale (no distance)
    const treeRefreshing = renderComponent(() =>
      AnnouncementCard({
        ad: adWithCoords,
        visitorCoords: { latitude: -27.5969, longitude: -48.5495 },
        isGpsFresh: false,
      }),
    );
    expect(
      findNodeByText(treeRefreshing, 'Florianópolis - Centro'),
    ).toBeTruthy();

    // 4. IP Fallback
    const treeIp = renderComponent(() =>
      AnnouncementCard({
        ad: mockAd,
        hasIpFallback: true,
      }),
    );
    expect(
      findNodeByText(treeIp, 'Região aproximada (Florianópolis)'),
    ).toBeTruthy();

    // 5. No signal
    const treeNoSignal = renderComponent(() =>
      AnnouncementCard({
        ad: mockAd,
      }),
    );
    expect(findNodeByText(treeNoSignal, 'Florianópolis - Centro')).toBeTruthy();
  });

  test('provider link click stops propagation and does not trigger detail navigation', () => {
    const tree = renderComponent(() => AnnouncementCard({ ad: mockAd }));
    const providerLink = findNodeByProp(tree, 'href', '/prestadores/prov-456');
    expect(providerLink).toBeTruthy();

    const stopPropagationMock = mock(() => {});
    providerLink.props.onClick({ stopPropagation: stopPropagationMock });
    expect(stopPropagationMock).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('fallback sequence: prefers WhatsApp over phone and email', () => {
    const tree = renderComponent(() => AnnouncementCard({ ad: mockAd }));
    const whatsappLink = findNodeByProp(
      tree,
      'href',
      'https://wa.me/5548999999999',
    );
    expect(whatsappLink).toBeTruthy();
    expect(findNodeByText(tree, 'WhatsApp')).toBeTruthy();
  });

  test('fallback sequence: uses phone when WhatsApp is missing', () => {
    const adPhoneOnly = {
      ...mockAd,
      contactLinks: {
        whatsapp: '',
        phone: '4833333333',
        email: 'pizza@test.com',
      },
    };
    const tree = renderComponent(() => AnnouncementCard({ ad: adPhoneOnly }));
    const phoneLink = findNodeByProp(tree, 'href', 'tel:4833333333');
    expect(phoneLink).toBeTruthy();
    expect(findNodeByText(tree, 'Ligar')).toBeTruthy();
    expect(findNodeByText(tree, 'WhatsApp')).toBeFalsy();
  });

  test('fallback sequence: uses email when WhatsApp and phone are missing', () => {
    const adEmailOnly = {
      ...mockAd,
      contactLinks: {
        whatsapp: '',
        phone: '',
        email: 'pizza@test.com',
      },
    };
    const tree = renderComponent(() => AnnouncementCard({ ad: adEmailOnly }));
    const emailLink = findNodeByProp(tree, 'href', 'mailto:pizza@test.com');
    expect(emailLink).toBeTruthy();
    expect(findNodeByText(tree, 'Email')).toBeTruthy();
  });

  test('fallback sequence: uses Detalhes button when all contacts are missing', () => {
    const adNoContact = {
      ...mockAd,
      contactLinks: {
        whatsapp: '',
        phone: '',
        email: '',
      },
    };
    const tree = renderComponent(() => AnnouncementCard({ ad: adNoContact }));
    expect(findNodeByText(tree, 'Detalhes')).toBeTruthy();
  });
});
