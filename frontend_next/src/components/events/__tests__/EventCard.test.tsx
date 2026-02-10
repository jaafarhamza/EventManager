import { render, screen } from "@testing-library/react";
import { EventCard } from "../EventCard";
import type { Event, EventStatus } from "@/types/api.types";

// Mock Next.js Link component
jest.mock("next/link", () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = 'Link';
  return MockLink;
});

const mockEvent: Event = {
  _id: "1",
  title: "Test Event",
  description: "Test Description for the event",
  date: "2026-03-01T14:00:00.000Z",
  location: "Paris, France",
  capacity: 50,
  availableSeats: 30,
  status: "PUBLISHED" as EventStatus,
  createdBy: "user123",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("EventCard", () => {
  it("should render event title", () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText("Test Event")).toBeInTheDocument();
  });

  it("should render event description", () => {
    render(<EventCard event={mockEvent} />);
    expect(
      screen.getByText("Test Description for the event"),
    ).toBeInTheDocument();
  });

  it("should render event location", () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText("Paris, France")).toBeInTheDocument();
  });

  it("should display available seats correctly", () => {
    render(<EventCard event={mockEvent} />);
    // Check that both numbers are present
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText(/places disponibles/i)).toBeInTheDocument();
  });

  it("should have a link to event detail page", () => {
    render(<EventCard event={mockEvent} />);
    const links = screen.getAllByRole("link");
    const detailLink = links.find(
      (link) => link.getAttribute("href") === `/events/${mockEvent._id}`,
    );
    expect(detailLink).toBeInTheDocument();
  });

  it("should format date correctly", () => {
    render(<EventCard event={mockEvent} />);
    // Check for date in French format - "dimanche 1 mars 2026"
    expect(screen.getByText(/dimanche.*1.*mars.*2026/i)).toBeInTheDocument();
  });

  it('should show "Complet" when no seats available', () => {
    const fullEvent = { ...mockEvent, availableSeats: 0 };
    render(<EventCard event={fullEvent} />);
    // There are multiple "Complet" texts, get all and check at least one exists
    const completTexts = screen.getAllByText(/complet/i);
    expect(completTexts.length).toBeGreaterThan(0);
  });

  it("should display capacity information", () => {
    render(<EventCard event={mockEvent} />);
    // Check that capacity is displayed in the format "X / 50 places disponibles"
    expect(screen.getByText(/\/ 50 places disponibles/i)).toBeInTheDocument();
  });
});
