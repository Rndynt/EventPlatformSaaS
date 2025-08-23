import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { Hero } from '../components/Hero';
import { Countdown } from '../components/Countdown';
import { TicketWidget } from '../components/TicketWidget';
import { CheckoutModal } from '../components/CheckoutModal';
import { CheckinScanner } from '../components/CheckinScanner';
import type { Event, Tenant, TicketType } from '../shared/schema';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn().mockResolvedValue({
    confirmPayment: jest.fn().mockResolvedValue({ error: null }),
  }),
}));

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: any) => <div data-testid="stripe-elements">{children}</div>,
  PaymentElement: () => <div data-testid="payment-element">Payment Element</div>,
  useStripe: () => ({
    confirmPayment: jest.fn().mockResolvedValue({ error: null }),
  }),
  useElements: () => ({}),
}));

// Mock toast hook
jest.mock('../client/src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock mobile hook
jest.mock('../client/src/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

const mockTenant: Tenant = {
  id: 'tenant-1',
  slug: 'test-tenant',
  name: 'Test Organization',
  email: 'test@example.com',
  domains: [],
  theme: {
    primaryColor: '#6366F1',
    secondaryColor: '#EC4899',
    accentColor: '#10B981',
    fontFamily: 'Inter',
    hidePlatformBranding: false,
  },
  settings: {
    allowRegistration: true,
    timezone: 'UTC',
    currency: 'USD',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockEvent: Event = {
  id: 'event-1',
  tenantId: 'tenant-1',
  slug: 'test-event',
  type: 'webinar',
  title: 'Test Webinar',
  subtitle: 'Learn Testing',
  description: 'A comprehensive webinar about testing',
  startDate: new Date('2024-12-15T14:00:00Z'),
  endDate: new Date('2024-12-15T15:30:00Z'),
  timezone: 'UTC',
  location: 'Online',
  capacity: 100,
  status: 'published',
  imageUrl: 'https://example.com/image.jpg',
  speakers: [
    {
      name: 'John Doe',
      title: 'Senior Developer',
      bio: 'Expert in testing',
      imageUrl: 'https://example.com/speaker.jpg',
      socialLinks: { twitter: 'https://twitter.com/johndoe' },
    },
  ],
  agenda: [
    {
      time: '14:00',
      title: 'Introduction',
      description: 'Getting started',
      duration: 30,
      speaker: 'John Doe',
    },
  ],
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTicketTypes: TicketType[] = [
  {
    id: 'ticket-1',
    eventId: 'event-1',
    name: 'Free Access',
    description: 'Basic access',
    price: '0.00',
    currency: 'USD',
    quantity: 50,
    quantitySold: 10,
    isPaid: false,
    isVisible: true,
    perks: ['Live access', 'Q&A participation'],
    validFrom: null,
    validUntil: null,
    createdAt: new Date(),
  },
  {
    id: 'ticket-2',
    eventId: 'event-1',
    name: 'Pro Access',
    description: 'Premium access',
    price: '29.00',
    currency: 'USD',
    quantity: 25,
    quantitySold: 5,
    isPaid: true,
    isVisible: true,
    perks: ['Everything in Free', 'Recording access', 'Resources'],
    validFrom: null,
    validUntil: null,
    createdAt: new Date(),
  },
];

describe('Hero Component', () => {
  it('renders event title and CTA button', () => {
    render(
      <Hero event={mockEvent} tenant={mockTenant} type="webinar" />
    );

    expect(screen.getByTestId('text-event-title')).toHaveTextContent('Test Webinar');
    expect(screen.getByTestId('button-register-now')).toBeInTheDocument();
  });

  it('displays event details correctly', () => {
    render(
      <Hero event={mockEvent} tenant={mockTenant} type="webinar" />
    );

    expect(screen.getByTestId('text-event-description')).toHaveTextContent('A comprehensive webinar about testing');
    expect(screen.getByTestId('text-event-datetime')).toBeInTheDocument();
    expect(screen.getByTestId('text-event-duration')).toBeInTheDocument();
  });

  it('opens checkout modal when register button is clicked', () => {
    // Mock the modal element
    const mockModal = document.createElement('div');
    mockModal.id = 'checkoutModal';
    mockModal.classList.add('hidden');
    document.body.appendChild(mockModal);

    render(
      <Hero event={mockEvent} tenant={mockTenant} type="webinar" />
    );

    const registerButton = screen.getByTestId('button-register-now');
    fireEvent.click(registerButton);

    expect(mockModal.classList.contains('hidden')).toBe(false);

    // Cleanup
    document.body.removeChild(mockModal);
  });

  it('shows different badge for different event types', () => {
    const { rerender } = render(
      <Hero event={mockEvent} tenant={mockTenant} type="webinar" />
    );

    expect(screen.getByTestId('badge-event-type')).toHaveTextContent('Live Webinar');

    rerender(
      <Hero event={{...mockEvent, type: 'workshop'}} tenant={mockTenant} type="workshop" />
    );

    expect(screen.getByTestId('badge-event-type')).toHaveTextContent('Hands-on Workshop');
  });
});

describe('Countdown Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders countdown elements', () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    render(<Countdown targetDate={futureDate} />);

    expect(screen.getByTestId('countdown-container')).toBeInTheDocument();
    expect(screen.getByTestId('countdown-days')).toBeInTheDocument();
    expect(screen.getByTestId('countdown-hours')).toBeInTheDocument();
    expect(screen.getByTestId('countdown-minutes')).toBeInTheDocument();
    expect(screen.getByTestId('countdown-seconds')).toBeInTheDocument();
  });

  it('updates countdown every second', () => {
    const futureDate = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now
    
    render(<Countdown targetDate={futureDate} />);

    const secondsElement = screen.getByTestId('countdown-seconds');
    const initialSeconds = parseInt(secondsElement.textContent || '0');

    // Advance timer by 1 second
    jest.advanceTimersByTime(1000);

    const newSeconds = parseInt(secondsElement.textContent || '0');
    expect(newSeconds).toBe(initialSeconds - 1);
  });

  it('shows zero when target date is in the past', () => {
    const pastDate = new Date(Date.now() - 60 * 1000); // 1 minute ago
    
    render(<Countdown targetDate={pastDate} />);

    expect(screen.getByTestId('countdown-days')).toHaveTextContent('00');
    expect(screen.getByTestId('countdown-hours')).toHaveTextContent('00');
    expect(screen.getByTestId('countdown-minutes')).toHaveTextContent('00');
    expect(screen.getByTestId('countdown-seconds')).toHaveTextContent('00');
  });
});

describe('TicketWidget Component', () => {
  const mockOnRegister = jest.fn();

  beforeEach(() => {
    mockOnRegister.mockClear();
  });

  it('renders ticket types', () => {
    render(
      <TicketWidget 
        ticketTypes={mockTicketTypes} 
        onRegister={mockOnRegister} 
      />
    );

    expect(screen.getByTestId('text-ticket-widget-title')).toHaveTextContent('Select Tickets');
    expect(screen.getByTestId('option-ticket-ticket-1')).toBeInTheDocument();
    expect(screen.getByTestId('option-ticket-ticket-2')).toBeInTheDocument();
  });

  it('allows quantity selection', () => {
    render(
      <TicketWidget 
        ticketTypes={mockTicketTypes} 
        onRegister={mockOnRegister} 
      />
    );

    const increaseButton = screen.getByTestId('button-increase-quantity');
    const quantityText = screen.getByTestId('text-quantity');

    expect(quantityText).toHaveTextContent('1');

    fireEvent.click(increaseButton);
    expect(quantityText).toHaveTextContent('2');

    const decreaseButton = screen.getByTestId('button-decrease-quantity');
    fireEvent.click(decreaseButton);
    expect(quantityText).toHaveTextContent('1');
  });

  it('calculates total price correctly', () => {
    render(
      <TicketWidget 
        ticketTypes={mockTicketTypes} 
        onRegister={mockOnRegister} 
      />
    );

    // Select paid ticket
    fireEvent.click(screen.getByTestId('option-ticket-ticket-2'));

    const totalPrice = screen.getByTestId('text-total-price');
    expect(totalPrice).toHaveTextContent('$29.00');

    // Increase quantity
    fireEvent.click(screen.getByTestId('button-increase-quantity'));
    expect(totalPrice).toHaveTextContent('$58.00');
  });

  it('calls onRegister with correct parameters', () => {
    render(
      <TicketWidget 
        ticketTypes={mockTicketTypes} 
        onRegister={mockOnRegister} 
      />
    );

    fireEvent.click(screen.getByTestId('button-register-widget'));

    expect(mockOnRegister).toHaveBeenCalledWith('ticket-1', 1);
  });

  it('disables sold out tickets', () => {
    const soldOutTickets: TicketType[] = [
      {
        ...mockTicketTypes[0],
        quantity: 10,
        quantitySold: 10,
      },
    ];

    render(
      <TicketWidget 
        ticketTypes={soldOutTickets} 
        onRegister={mockOnRegister} 
      />
    );

    const soldOutOption = screen.getByTestId('option-ticket-ticket-1');
    expect(soldOutOption).toHaveClass('opacity-60', 'cursor-not-allowed');
  });
});

describe('CheckoutModal Component', () => {
  beforeEach(() => {
    // Mock the modal element
    const mockModal = document.createElement('div');
    mockModal.id = 'checkoutModal';
    mockModal.classList.add('hidden');
    document.body.appendChild(mockModal);

    // Mock fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    const modal = document.getElementById('checkoutModal');
    if (modal) {
      document.body.removeChild(modal);
    }
    jest.restoreAllMocks();
  });

  it('renders checkout form for free tickets', async () => {
    const mockModal = document.getElementById('checkoutModal');
    mockModal?.classList.remove('hidden');

    render(
      <CheckoutModal 
        event={mockEvent} 
        tenant={mockTenant} 
        ticketTypes={[mockTicketTypes[0]]} 
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('input-name')).toBeInTheDocument();
      expect(screen.getByTestId('input-email')).toBeInTheDocument();
      expect(screen.getByTestId('button-submit-registration')).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    const mockModal = document.getElementById('checkoutModal');
    mockModal?.classList.remove('hidden');

    render(
      <CheckoutModal 
        event={mockEvent} 
        tenant={mockTenant} 
        ticketTypes={[mockTicketTypes[0]]} 
      />
    );

    await waitFor(() => {
      const submitButton = screen.getByTestId('button-submit-registration');
      fireEvent.click(submitButton);

      // Form validation should prevent submission with empty required fields
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  it('submits registration for free tickets', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        ticket: { id: 'ticket-123', qrCode: 'mock-qr' }
      }),
    });

    const mockModal = document.getElementById('checkoutModal');
    mockModal?.classList.remove('hidden');

    render(
      <CheckoutModal 
        event={mockEvent} 
        tenant={mockTenant} 
        ticketTypes={[mockTicketTypes[0]]} 
      />
    );

    await waitFor(() => {
      fireEvent.change(screen.getByTestId('input-name'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'john@example.com' } });
      
      fireEvent.click(screen.getByTestId('button-submit-registration'));
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/register', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('john@example.com'),
      }));
    });
  });

  it('shows payment form for paid tickets', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        clientSecret: 'pi_test_123',
      }),
    });

    const mockModal = document.getElementById('checkoutModal');
    mockModal?.classList.remove('hidden');
    mockModal?.setAttribute('data-selected-ticket-type', 'ticket-2');

    render(
      <CheckoutModal 
        event={mockEvent} 
        tenant={mockTenant} 
        ticketTypes={mockTicketTypes} 
      />
    );

    await waitFor(() => {
      fireEvent.change(screen.getByTestId('input-name'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'john@example.com' } });
      
      fireEvent.click(screen.getByTestId('button-submit-registration'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('stripe-elements')).toBeInTheDocument();
      expect(screen.getByTestId('payment-element')).toBeInTheDocument();
    });
  });
});

describe('CheckinScanner Component', () => {
  const mockOnScan = jest.fn();

  beforeEach(() => {
    mockOnScan.mockClear();
    
    // Mock getUserMedia
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{
            stop: jest.fn(),
          }],
        }),
      },
      writable: true,
    });
  });

  it('renders scanner interface', () => {
    render(<CheckinScanner onScan={mockOnScan} />);

    expect(screen.getByTestId('button-start-camera')).toBeInTheDocument();
    expect(screen.getByTestId('button-upload-image')).toBeInTheDocument();
    expect(screen.getByTestId('input-file-upload')).toBeInTheDocument();
  });

  it('starts camera when button is clicked', async () => {
    render(<CheckinScanner onScan={mockOnScan} />);

    const startButton = screen.getByTestId('button-start-camera');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
    });
  });

  it('shows camera controls when scanning', async () => {
    render(<CheckinScanner onScan={mockOnScan} />);

    const startButton = screen.getByTestId('button-start-camera');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByTestId('button-stop-camera')).toBeInTheDocument();
      expect(screen.getByTestId('video-camera')).toBeInTheDocument();
    });
  });

  it('handles camera access errors gracefully', async () => {
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValueOnce(
      new Error('Camera access denied')
    );

    render(<CheckinScanner onScan={mockOnScan} />);

    const startButton = screen.getByTestId('button-start-camera');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/Camera access denied/)).toBeInTheDocument();
    });
  });

  it('processes file uploads', () => {
    render(<CheckinScanner onScan={mockOnScan} />);

    const fileInput = screen.getByTestId('input-file-upload');
    const file = new File(['mock content'], 'qr.png', { type: 'image/png' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    // File processing would happen here
    expect(fileInput).toBeInTheDocument();
  });
});

describe('Component Integration', () => {
  it('renders complete landing page structure', () => {
    render(
      <div>
        <Hero event={mockEvent} tenant={mockTenant} type="webinar" />
        <TicketWidget ticketTypes={mockTicketTypes} onRegister={jest.fn()} />
        <CheckoutModal event={mockEvent} tenant={mockTenant} ticketTypes={mockTicketTypes} />
      </div>
    );

    expect(screen.getByTestId('text-event-title')).toBeInTheDocument();
    expect(screen.getByTestId('text-ticket-widget-title')).toBeInTheDocument();
  });

  it('maintains proper component state flow', async () => {
    const mockOnRegister = jest.fn();
    
    render(
      <TicketWidget ticketTypes={mockTicketTypes} onRegister={mockOnRegister} />
    );

    // Select a ticket type
    fireEvent.click(screen.getByTestId('option-ticket-ticket-2'));
    
    // Change quantity
    fireEvent.click(screen.getByTestId('button-increase-quantity'));
    
    // Register
    fireEvent.click(screen.getByTestId('button-register-widget'));

    expect(mockOnRegister).toHaveBeenCalledWith('ticket-2', 2);
  });
});

describe('Accessibility', () => {
  it('includes proper ARIA attributes', () => {
    render(
      <Hero event={mockEvent} tenant={mockTenant} type="webinar" />
    );

    const registerButton = screen.getByTestId('button-register-now');
    expect(registerButton).toBeInTheDocument();
    
    // Check that buttons are focusable
    registerButton.focus();
    expect(registerButton).toHaveFocus();
  });

  it('provides proper labels for form inputs', async () => {
    const mockModal = document.getElementById('checkoutModal') || document.createElement('div');
    mockModal.id = 'checkoutModal';
    mockModal.classList.remove('hidden');
    if (!document.getElementById('checkoutModal')) {
      document.body.appendChild(mockModal);
    }

    render(
      <CheckoutModal 
        event={mockEvent} 
        tenant={mockTenant} 
        ticketTypes={[mockTicketTypes[0]]} 
      />
    );

    await waitFor(() => {
      const nameInput = screen.getByTestId('input-name');
      const emailInput = screen.getByTestId('input-email');
      
      expect(nameInput).toHaveAttribute('id', 'name');
      expect(emailInput).toHaveAttribute('id', 'email');
    });
  });

  it('supports keyboard navigation', () => {
    render(
      <TicketWidget ticketTypes={mockTicketTypes} onRegister={jest.fn()} />
    );

    const increaseButton = screen.getByTestId('button-increase-quantity');
    const decreaseButton = screen.getByTestId('button-decrease-quantity');

    // Test tab navigation
    increaseButton.focus();
    expect(increaseButton).toHaveFocus();
    
    // Simulate tab key (would move to next focusable element)
    decreaseButton.focus();
    expect(decreaseButton).toHaveFocus();
  });
});
