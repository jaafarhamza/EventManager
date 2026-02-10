"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { reservationsApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/api/error-handler";
import { ReservationCard } from "@/components/dashboard/ReservationCard";
import type { Reservation } from "@/types/api.types";

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");
  const isFetchingRef = useRef(false);

  useEffect(() => {
    const fetchReservations = async () => {
      // Prevent multiple simultaneous requests
      if (isFetchingRef.current) return;
      
      try {
        isFetchingRef.current = true;
        setLoading(true);
        setError(null);
        const data = await reservationsApi.getAll();
        setReservations(data);
      } catch (err) {
        console.error("Error fetching reservations:", err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    };

    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    // Prevent multiple simultaneous requests
    if (isFetchingRef.current) return;
    
    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);
      const data = await reservationsApi.getAll();
      setReservations(data);
    } catch (err) {
      console.error("Error fetching reservations:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const handleCancel = async (id: string, reason?: string) => {
    if (!confirm("Êtes-vous sûr de vouloir annuler cette réservation ?")) {
      return;
    }

    try {
      await reservationsApi.cancel(id, reason ? { reason } : undefined);
      // Refresh the list
      await fetchReservations();
    } catch (err) {
      console.error("Error canceling reservation:", err);
      alert(`Erreur lors de l'annulation: ${getErrorMessage(err)}`);
    }
  };

  const handleDownloadTicket = async (id: string) => {
    try {
      const blob = await reservationsApi.downloadTicket(id);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ticket-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading ticket:", err);
      alert(`Erreur lors du téléchargement: ${getErrorMessage(err)}`);
    }
  };

  const filteredReservations = reservations.filter((reservation) => {
    if (filter === "all") return true;

    const eventDate = new Date(
      typeof reservation.eventId === "string" ? "" : reservation.eventId.date,
    );
    const now = new Date();

    if (filter === "upcoming") {
      return eventDate > now;
    } else {
      return eventDate <= now;
    }
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-(--color-muted) animate-pulse rounded" />
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 bg-(--color-card) border border-(--color-border) rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-(family-name:--font-mclaren) font-bold">
            Mes Réservations
          </h1>
          <p className="text-(--color-muted-foreground) mt-1">
            Gérez vos inscriptions aux événements
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("upcoming")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === "upcoming"
                ? "bg-(--color-primary) text-(--color-primary-foreground) shadow-md"
                : "bg-(--color-muted) text-(--color-muted-foreground) hover:bg-(--color-muted)/80"
            }`}
          >
            À venir
          </button>
          <button
            onClick={() => setFilter("past")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === "past"
                ? "bg-(--color-primary) text-(--color-primary-foreground) shadow-md"
                : "bg-(--color-muted) text-(--color-muted-foreground) hover:bg-(--color-muted)/80"
            }`}
          >
            Passés
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === "all"
                ? "bg-(--color-primary) text-(--color-primary-foreground) shadow-md"
                : "bg-(--color-muted) text-(--color-muted-foreground) hover:bg-(--color-muted)/80"
            }`}
          >
            Tous
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-(--color-destructive)/10 border border-(--color-destructive)/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-(--color-destructive) shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-(--color-destructive)">{error}</p>
          </div>
        </div>
      )}

      {/* Reservations List */}
      {filteredReservations.length === 0 ? (
        <div className="text-center py-16 bg-(--color-card) border border-(--color-border) rounded-2xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-(--color-muted) mb-4">
            <svg
              className="w-8 h-8 text-(--color-muted-foreground)"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-(--color-foreground) mb-2">
            Aucune réservation
          </h3>
          <p className="text-(--color-muted-foreground) mb-6">
            Vous n&apos;avez pas encore de réservation pour le moment
          </p>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 px-6 py-3  text-(--color-primary-foreground) rounded-lg hover:opacity-90 transition-opacity"
          >
            Découvrir les événements
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredReservations.map((reservation) => (
            <ReservationCard
              key={reservation._id}
              reservation={reservation}
              onCancel={handleCancel}
              onDownloadTicket={handleDownloadTicket}
            />
          ))}
        </div>
      )}
    </div>
  );
}
