import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventForm } from '../EventForm';
import type { Event, EventStatus } from '@/types/api.types';

// Mock Next.js router
const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    back: mockBack,
    push: jest.fn(),
  }),
}));

describe('EventForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all form fields', () => {
    render(<EventForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/titre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date et heure/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lieu/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/capacité/i)).toBeInTheDocument();
  });

  it('should render submit button with correct label', () => {
    render(<EventForm onSubmit={mockOnSubmit} submitLabel="Créer" />);

    expect(screen.getByRole('button', { name: /créer/i })).toBeInTheDocument();
  });

  it('should render cancel button', () => {
    render(<EventForm onSubmit={mockOnSubmit} />);

    expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument();
  });

  it('should call router.back when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<EventForm onSubmit={mockOnSubmit} />);

    const cancelButton = screen.getByRole('button', { name: /annuler/i });
    await user.click(cancelButton);

    expect(mockBack).toHaveBeenCalled();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);

    render(<EventForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/titre/i), 'New Event');
    await user.type(screen.getByLabelText(/description/i), 'Event description');
    await user.type(screen.getByLabelText(/date et heure/i), '2026-03-01T14:00');
    await user.type(screen.getByLabelText(/lieu/i), 'Paris');
    await user.clear(screen.getByLabelText(/capacité/i));
    await user.type(screen.getByLabelText(/capacité/i), '100');

    const submitButton = screen.getByRole('button', { name: /créer/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'New Event',
        description: 'Event description',
        date: '2026-03-01T14:00',
        location: 'Paris',
        capacity: 100,
      });
    });
  });

  it('should pre-fill form with initial data', () => {
    const initialData: Event = {
      _id: '1',
      title: 'Existing Event',
      description: 'Existing description',
      date: '2026-03-01T14:00:00.000Z',
      location: 'Lyon',
      capacity: 75,
      availableSeats: 50,
      status: 'PUBLISHED' as EventStatus,
      createdBy: 'user123',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    render(<EventForm initialData={initialData} onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/titre/i)).toHaveValue('Existing Event');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Existing description');
    expect(screen.getByLabelText(/lieu/i)).toHaveValue('Lyon');
    expect(screen.getByLabelText(/capacité/i)).toHaveValue(75);
  });

  it('should display error message on submission failure', async () => {
    const user = userEvent.setup();
    const errorResponse = {
      response: {
        data: {
          message: 'Validation failed',
        },
      },
    };
    mockOnSubmit.mockRejectedValue(errorResponse);

    render(<EventForm onSubmit={mockOnSubmit} />);

    // Fill in required fields to bypass HTML5 validation
    await user.type(screen.getByLabelText(/titre/i), 'Test Event');
    await user.type(screen.getByLabelText(/description/i), 'Test Description');
    await user.type(screen.getByLabelText(/date et heure/i), '2026-03-01T14:00');
    await user.type(screen.getByLabelText(/lieu/i), 'Paris');

    const submitButton = screen.getByRole('button', { name: /créer/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/validation failed/i)).toBeInTheDocument();
    });
  });

  it('should disable submit button while submitting', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<EventForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/titre/i), 'Test');
    await user.type(screen.getByLabelText(/description/i), 'Test');
    await user.type(screen.getByLabelText(/date et heure/i), '2026-03-01T14:00');
    await user.type(screen.getByLabelText(/lieu/i), 'Paris');

    const submitButton = screen.getByRole('button', { name: /créer/i });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<EventForm onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', { name: /créer/i });
    await user.click(submitButton);

    // HTML5 validation should prevent submission
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should handle capacity input correctly', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);

    render(<EventForm onSubmit={mockOnSubmit} />);

    const capacityInput = screen.getByLabelText(/capacité/i);
    await user.clear(capacityInput);
    await user.type(capacityInput, '250');

    expect(capacityInput).toHaveValue(250);
  });
});
