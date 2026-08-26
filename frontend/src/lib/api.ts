/**
 * Thin fetch wrapper for the Flask API. Session-cookie auth: the Vite dev
 * proxy (and Flask itself in prod) keeps everything same-origin.
 */
import { toast } from "sonner";
import { navigate } from "wouter/use-browser-location";

export class ApiError extends Error {
  status: number;
  needsConfirmation: boolean;

  constructor(message: string, status: number, needsConfirmation = false) {
    super(message);
    this.status = status;
    this.needsConfirmation = needsConfirmation;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const needsConfirmation = Boolean(
      (data as { needs_confirmation?: boolean }).needs_confirmation,
    );
    if (needsConfirmation) {
      // Central handling: any gated action prompts the user to confirm.
      toast.error("Confirma tu cuenta para continuar", {
        description: "Verifica tu correo antes de reservar o publicar.",
        action: { label: "Confirmar", onClick: () => navigate("/confirmar") },
      });
    }
    throw new ApiError(
      (data as { error?: string }).error ?? "Error de conexión con el servidor",
      res.status,
      needsConfirmation,
    );
  }
  return data as T;
}

export const post = <T>(path: string, body?: unknown) =>
  api<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

export const put = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "PUT", body: JSON.stringify(body) });

export const del = <T>(path: string) => api<T>(path, { method: "DELETE" });

// ---------------------------------------------------------------------------
// API types (mirroring app.py's entry_to_json / request_to_json / auth._me_json)
// ---------------------------------------------------------------------------

export interface Me {
  id: string;
  role: "owner" | "renter";
  name: string;
  email: string;
  location: string;
  social_media: Record<string, string>;
  confirmed: boolean;
  preferences?: Preferences;
  demo_confirmation_code?: string;
}

export interface Preferences {
  price_min?: number | null;
  price_max?: number | null;
  capacity_bucket?: string | null;
  preferred_stadiums?: string[];
  preferred_teams?: string[];
}

export interface Stadium {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
}

export interface FeedEntry {
  listing_id: string;
  date: string;
  price: number;
  capacity: number;
  description: string;
  box_id: string;
  owner_id: string;
  box_description: string;
  box_location: string;
  stadium_id: string;
  stadium_name: string;
  stadium_city: string;
  rating: number | null;
  review_count: number;
  fair_value?: number;
  discount?: number;
}

export interface RentRequest {
  id: string;
  box_id: string;
  renter_id: string;
  date: string;
  price: number;
  status: "pending" | "accepted" | "rejected" | "paid" | "completed";
  reject_reason: string | null;
  message: string;
  payment: Record<string, unknown> | null;
  instructions: string | null;
  survey: Record<string, unknown> | null;
}

export interface BoxListing {
  listing_id: string;
  box_id: string;
  stadium_id: string;
  date: string;
  price: number;
  capacity: number;
  location_in_stadium: string;
  description: string;
}

export interface BoxRequest {
  request_id: string;
  box_id: string;
  renter_id: string;
  renter_name: string;
  date: string;
  message: string;
  status: string;
  reject_reason?: string | null;
  requested_at?: string;
  renter_history: Array<{
    request_id: string;
    box_id: string;
    date: string;
    price: number;
    status: string;
  }>;
}

export interface BookingRecord {
  box_id: string;
  stadium_id: string;
  date: string;
  price_rented: number;
  price_owner_received: number;
  renter_name: string;
  location_in_stadium: string;
  event_description: string;
}

export interface Box {
  id: string;
  owner_id: string;
  stadium_id: string;
  capacity: number;
  location_in_stadium: string;
  description: string;
  available_dates: BoxListing[];
  requested_dates: Record<string, BoxRequest[]>;
  booking_history: BookingRecord[];
}
