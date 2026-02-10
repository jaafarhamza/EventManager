import { render, screen } from '@testing-library/react';
import { StatsCard } from '../StatsCard';

describe('StatsCard', () => {
  it('should render title and value', () => {
    render(
      <StatsCard
        title="Total Events"
        value={42}
        icon="🎫"
        color="blue"
      />
    );

    expect(screen.getByText('Total Events')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should render icon', () => {
    render(
      <StatsCard
        title="Total Events"
        value={42}
        icon="🎫"
        color="blue"
      />
    );

    expect(screen.getByText('🎫')).toBeInTheDocument();
  });

  it('should render subtitle when provided', () => {
    render(
      <StatsCard
        title="Total Events"
        value={42}
        icon="🎫"
        color="blue"
        subtitle="Last 30 days"
      />
    );

    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
  });

  it('should handle string values', () => {
    render(
      <StatsCard
        title="Fill Rate"
        value="75%"
        icon="📊"
        color="purple"
      />
    );

    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('should apply correct color class for blue', () => {
    const { container } = render(
      <StatsCard
        title="Test"
        value={10}
        icon="🎫"
        color="blue"
      />
    );

    const iconContainer = container.querySelector('.from-blue-500');
    expect(iconContainer).toBeInTheDocument();
  });

  it('should apply correct color class for green', () => {
    const { container } = render(
      <StatsCard
        title="Test"
        value={10}
        icon="✅"
        color="green"
      />
    );

    const iconContainer = container.querySelector('.from-green-500');
    expect(iconContainer).toBeInTheDocument();
  });

  it('should apply correct color class for purple', () => {
    const { container } = render(
      <StatsCard
        title="Test"
        value={10}
        icon="📊"
        color="purple"
      />
    );

    const iconContainer = container.querySelector('.from-purple-500');
    expect(iconContainer).toBeInTheDocument();
  });

  it('should apply correct color class for yellow', () => {
    const { container } = render(
      <StatsCard
        title="Test"
        value={10}
        icon="⏳"
        color="yellow"
      />
    );

    const iconContainer = container.querySelector('.from-yellow-500');
    expect(iconContainer).toBeInTheDocument();
  });

  it('should apply correct color class for red', () => {
    const { container } = render(
      <StatsCard
        title="Test"
        value={10}
        icon="❌"
        color="red"
      />
    );

    const iconContainer = container.querySelector('.from-red-500');
    expect(iconContainer).toBeInTheDocument();
  });
});
