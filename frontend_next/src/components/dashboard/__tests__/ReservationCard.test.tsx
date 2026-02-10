import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReservationCard } from '../ReservationCard';
import type { Reservation, ReservationStatus, EventStatus } from '@/types/api.types';

// Mock Next.js Link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = 'Link';
  return MockLink;
});

const mockReservation: Reservation = {
  _id: '1',
  status: 'CONFIRMED' as ReservationStatus,
  eventId: {
    _id: 'event1',
    title: 'Test Event',
    description: 'Test Description',
    date: '2026-03-01T14:00:00.000Z',
    location: 'Paris',
    capacity: 50,
    availableSeats: 30,
    status: 'PUBLISHED' as EventStatus,
    createdBy: 'user123',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  userId: 'user123',
  canceledAt: null,
  cancelReason: null,
  createdAt: '2024-01-15T10:00:00.000Z',
  updatedAt: '2024-01-15T10:00:00.000Z',
};

describe('ReservationCard', () => {
  const mockOnCancel = jest.fn();
  const mockOnDownloadTicket = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render reservation with event details', () => {
    render(
      <ReservationCard
        reservation={mockReservation}
        onCancel={mockOnCancel}
        onDownloadTicket={mockOnDownloadTicket}
      />
    );

    expect(screen.getByText('Test Event')).toBeInTheDocument();
    expect(screen.getByText('Paris')).toBeInTheDocument();
  });

  it('should display confirmed status badge', () => {
    render(
      <ReservationCard
        reservation={mockReservation}
        onCancel={mockOnCancel}
        onDownloadTicket={mockOnDownloadTicket}
      />
    );

    expect(screen.getByText(/confirmée/i)).toBeInTheDocument();
  });

  it('should show download ticket button for confirmed reservations', () => {
    render(
      <ReservationCard
        reservation={mockReservation}
        onCancel={mockOnCancel}
        onDownloadTicket={mockOnDownloadTicket}
      />
    );

    expect(screen.getByText(/télécharger.*ticket/i)).toBeInTheDocument();
  });

  it('should call onDownloadTicket when download button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ReservationCard
        reservation={mockReservation}
        onCancel={mockOnCancel}
        onDownloadTicket={mockOnDownloadTicket}
      />
    );

    const downloadButton = screen.getByText(/télécharger.*ticket/i);
    await user.click(downloadButton);

    expect(mockOnDownloadTicket).toHaveBeenCalledWith('1');
  });

  it('should show cancel button for confirmed reservations', () => {
    render(
      <ReservationCard
        reservation={mockReservation}
        onCancel={mockOnCancel}
        onDownloadTicket={mockOnDownloadTicket}
      />
    );

    expect(screen.getByText(/annuler/i)).toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ReservationCard
        reservation={mockReservation}
        onCancel={mockOnCancel}
        onDownloadTicket={mockOnDownloadTicket}
      />
    );

    // Click the "Annuler la réservation" button to open modal
    const cancelButton = screen.getByText(/annuler la réservation/i);
    await user.click(cancelButton);

    // Wait for modal and click confirm button
    const confirmButton = await screen.findByText(/confirmer l'annulation/i);
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockOnCancel).toHaveBeenCalledWith('1', undefined);
    });
  });

  it('should display pending status correctly', () => {
    const pendingReservation: Reservation = { 
      ...mockReservation, 
      status: 'PENDING' as ReservationStatus 
    };
    render(
      <ReservationCard
        reservation={pendingReservation}
        onCancel={mockOnCancel}
        onDownloadTicket={mockOnDownloadTicket}
      />
    );

    expect(screen.getByText(/en attente/i)).toBeInTheDocument();
  });

  it('should not show download button for pending reservations', () => {
    const pendingReservation: Reservation = { 
      ...mockReservation, 
      status: 'PENDING' as ReservationStatus 
    };
    render(
      <ReservationCard
        reservation={pendingReservation}
        onCancel={mockOnCancel}
        onDownloadTicket={mockOnDownloadTicket}
      />
    );

    expect(screen.queryByText(/télécharger.*ticket/i)).not.toBeInTheDocument();
  });

  it('should display canceled status and reason', () => {
    const canceledReservation: Reservation = {
      ...mockReservation,
      status: 'CANCELED' as ReservationStatus,
      cancelReason: 'User requested cancellation',
      canceledAt: '2024-01-20T10:00:00.000Z',
    };

    render(
      <ReservationCard
        reservation={canceledReservation}
        onCancel={mockOnCancel}
        onDownloadTicket={mockOnDownloadTicket}
      />
    );

    expect(screen.getByText(/annulée/i)).toBeInTheDocument();
  });

  it('should format reservation date correctly', () => {
    render(
      <ReservationCard
        reservation={mockReservation}
        onCancel={mockOnCancel}
        onDownloadTicket={mockOnDownloadTicket}
      />
    );

    // Check for formatted date
    expect(screen.getByText(/15.*janv.*2024/i)).toBeInTheDocument();
  });
});
