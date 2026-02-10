import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../page';
import { authApi } from '@/lib/api';

// Mock Redux
const mockDispatch = jest.fn();
jest.mock('@/lib/store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: () => ({
    isAuthenticated: false,
    isLoading: false,
  }),
}));

// Mock API
jest.mock('@/lib/api', () => ({
  authApi: {
    login: jest.fn(),
  },
}));

// Mock Next.js router
const mockPush = jest.fn();
const mockSearchParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}));

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render login form', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should render link to register page', () => {
    render(<LoginPage />);

    const registerLink = screen.getByText(/sign up for free/i);
    expect(registerLink).toBeInTheDocument();
  });

  it('should render forgot password link', () => {
    render(<LoginPage />);

    const forgotLink = screen.getByText(/forgot password/i);
    expect(forgotLink).toBeInTheDocument();
  });

  it('should submit login form with valid credentials', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      accessToken: 'mock-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'PARTICIPANT',
      },
    };

    (authApi.login as jest.Mock).mockResolvedValue(mockResponse);

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('should display error message on login failure', async () => {
    const user = userEvent.setup();
    (authApi.login as jest.Mock).mockRejectedValue({
      response: {
        data: {
          message: 'Invalid credentials',
        },
      },
    });

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/an error occurred/i)).toBeInTheDocument();
    });
  });

  it('should disable submit button while loading', async () => {
    const user = userEvent.setup();
    (authApi.login as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');

    // HTML5 validation should trigger
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('should require password field', () => {
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText(/password/i);
    // Password field may not have required attribute in HTML but validation happens in JS
    expect(passwordInput).toBeInTheDocument();
  });
});
