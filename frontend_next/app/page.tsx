import Link from "next/link";
import { HeroSection, FeaturesSection } from "@/components/home";
import { EventCard } from "@/components/events";
import { Button } from "@/components/ui";
import type { Event } from "@/types/api.types";

// Server-side data fetching for featured events
async function getFeaturedEvents(): Promise<Event[]> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  try {
    console.log("Fetching featured events from:", `${API_URL}/events`);

    const response = await fetch(`${API_URL}/events`, {
      next: { revalidate: 60 },
      cache: "no-store",
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      console.error(
        "Failed to fetch events:",
        response.status,
        response.statusText,
      );
      return [];
    }

    const events: Event[] = await response.json();
    console.log("Total events fetched:", events.length);

    // Filter published events and sort by date
    const publishedEvents = events
      .filter((event) => {
        const isPublished = event.status === "PUBLISHED";
        const isFuture = new Date(event.date) > new Date();
        console.log(
          `Event ${event.title}: published=${isPublished}, future=${isFuture}`,
        );
        return isPublished && isFuture;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);

    console.log("Featured events count:", publishedEvents.length);
    return publishedEvents;
  } catch (error) {
    console.error("Error fetching featured events:", error);
    return [];
  }
}

export default async function Home() {
  const featuredEvents = await getFeaturedEvents();

  console.log(
    "Rendering home page with",
    featuredEvents.length,
    "featured events",
  );

  return (
    <main>
      <HeroSection />
      <FeaturesSection />

      {/* Featured Events Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-(family-name:--font-mclaren) font-bold text-(--color-foreground) mb-4">
              Événements à venir
            </h2>
            <p className="text-lg text-(--color-muted-foreground) max-w-2xl mx-auto">
              Découvrez notre sélection d&apos;événements et réservez votre
              place dès maintenant
            </p>
          </div>

          {featuredEvents.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {featuredEvents.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>

              <div className="text-center">
                <Link href="/events">
                  <Button variant="primary" className="px-8 py-3 text-lg">
                    Voir tous les événements
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-(--color-muted-foreground) mb-6">
                Aucun événement à venir pour le moment.
              </p>
              <Link href="/events">
                <Button variant="primary" className="px-8 py-3 text-lg">
                  Voir tous les événements
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
