import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventsManagementPage from '../page';
import { eventsApi } from '@/lib/api';

// Mock the API
jest.mock('@/lib/api', () => ({
  eventsApi: {
    getAll: jest.fn(),
    publish: jest.fn(),
    cancel: jest.fn(),
  },
}));

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockEvents = [
  {
    _id: '1',
    title: 'Event 1',
    description: 'Description 1',
    date: '2026-03-01T14:00:00.000Z',
    location: 'Paris',
    capacity: 50,
    availableSeats: 30,
    status: 'PUBLISHED' as const,
    createdBy: 'user123',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    _id: '2',
    title: 'Event 2',
    description: 'Description 2',
    date: '2026-04-01T14:00:00.000Z',
    location: 'Lyon',
    capacity: 100,
    availableSeats: 80,
    status: 'DRAFT' as const,
    createdBy: 'user123',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

describe('EventsManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (eventsApi.getAll as jest.Mock).mockResolvedValue(mockEvents);
  });

  it('should render page title', async () => {
    render(<EventsManagementPage />);

    await waitFor(() => {
      expect(screen.getByText(/gestion des événements/i)).toBeInTheDocument();
    });
  });

  it('should fetch and display events', async () => {
    render(<EventsManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Event 1')).toBeInTheDocument();
      expect(screen.getByText('Event 2')).toBeInTheDocument();
    });

    expect(eventsApi.getAll).toHaveBeenCalledTimes(1);
  });

  it('should show loading state initially', () => {
    render(<EventsManagementPage />);

    // Check for loading skeleton
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should navigate to new event page when button clicked', async () => {
    const user = userEvent.setup();
    render(<EventsManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Event 1')).toBeInTheDocument();
    });

    const newEventButton = screen.getByRole('button', { name: /nouvel événement/i });
    await user.click(newEventButton);

    expect(mockPush).toHaveBeenCalledWith('/dashboard/events/new');
  });

  it('should publish draft event', async () => {
    const user = userEvent.setup();
    (eventsApi.publish as jest.Mock).mockResolvedValue({});
    (eventsApi.getAll as jest.Mock).mockResolvedValue(mockEvents);

    render(<EventsManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Event 2')).toBeInTheDocument();
    });

    const publishButtons = screen.getAllByText(/publier/i);
    await user.click(publishButtons[0]);

    await waitFor(() => {
      expect(eventsApi.publish).toHaveBeenCalledWith('2');
      expect(eventsApi.getAll).toHaveBeenCalledTimes(2); // Initial + after publish
    });
  });

  it('should filter events by status', async () => {
    const user = userEvent.setup();
    render(<EventsManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Event 1')).toBeInTheDocument();
      expect(screen.getByText('Event 2')).toBeInTheDocument();
    });

    // Click on "Brouillons" filter
    const draftFilter = screen.getByRole('button', { name: /brouillons/i });
    await user.click(draftFilter);

    // Only draft event should be visible
    expect(screen.getByText('Event 2')).toBeInTheDocument();
    expect(screen.queryByText('Event 1')).not.toBeInTheDocument();
  });

  it('should display error message on fetch failure', async () => {
    (eventsApi.getAll as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<EventsManagementPage />);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('should navigate to edit page when edit button clicked', async () => {
    const user = userEvent.setup();
    render(<EventsManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Event 1')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText(/modifier/i);
    await user.click(editButtons[0]);

    expect(mockPush).toHaveBeenCalledWith('/dashboard/events/1/edit');
  });
});
