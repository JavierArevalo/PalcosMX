/**
 * Owner: one private box — its listings (publish / remove) in the
 * FeaturedVenues visual language.
 */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarPlus, Trash2, MapPin, Users } from "lucide-react";
import { post, del, type Box, type Stadium, type BoxListing } from "@/lib/api";
import { formatMXN, formatDate } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif" } as const;

function ListingForm({ box, onDone }: { box: Box; onDone: () => void }) {
  const [date, setDate] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const publish = async () => {
    if (!date || !price) {
      toast.error("La fecha y el precio son obligatorios");
      return;
    }
    setBusy(true);
    try {
      await post<BoxListing>(`/api/boxes/${box.id}/listings`, {
        date,
        price: Number(price),
        description: description.trim(),
      });
      toast.success("Publicación creada.");
      setDate("");
      setPrice("");
      setDescription("");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo publicar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-white/8 rounded-md p-3 space-y-2 bg-white/[0.02]">
      <div className="grid grid-cols-2 gap-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="[color-scheme:dark] text-xs" />
        <Input type="number" min="0" step="0.01" placeholder="Precio (MXN)" value={price} onChange={(e) => setPrice(e.target.value)} className="text-xs" />
      </div>
      <Input placeholder="Evento (p. ej. Clásico Regiomontano)" value={description} onChange={(e) => setDescription(e.target.value)} className="text-xs" />
      <Button onClick={publish} disabled={busy} size="sm" className="btn-gold rounded-sm w-full">
        <CalendarPlus size={13} /> {busy ? "Publicando..." : "Publicar fecha"}
      </Button>
    </div>
  );
}

export default function BoxCard({ box, stadium }: { box: Box; stadium?: Stadium }) {
  const queryClient = useQueryClient();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["myBoxes"] });
    queryClient.invalidateQueries({ queryKey: ["feed"] });
  };

  const removeListing = async (date: string) => {
    try {
      await del(`/api/boxes/${box.id}/listings/${date}`);
      toast.success("Publicación eliminada.");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar");
    }
  };

  return (
    <div className="bg-[oklch(0.13_0.007_260)] border border-white/6 rounded-lg p-5 flex flex-col gap-4">
      <div>
        <div className="w-8 h-0.5 bg-gradient-to-r from-[oklch(0.72_0.12_75)] to-transparent mb-3" />
        <h3 className="text-lg font-semibold text-white leading-snug" style={serif}>
          {box.description || "Suite Privada"}
        </h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-[oklch(0.58_0.010_260)]" style={outfit}>
          <span className="flex items-center gap-1">
            <MapPin size={11} className="text-[oklch(0.72_0.12_75)]" />
            {stadium ? `${stadium.name} — ${stadium.city}` : box.stadium_id}
            {box.location_in_stadium ? ` · ${box.location_in_stadium}` : ""}
          </span>
          <span className="flex items-center gap-1">
            <Users size={11} /> {box.capacity} personas
          </span>
        </div>
      </div>

      {/* Listings */}
      <div className="space-y-2">
        {box.available_dates.length === 0 ? (
          <p className="text-xs text-[oklch(0.50_0.008_260)] italic" style={outfit}>
            Sin fechas publicadas.
          </p>
        ) : (
          box.available_dates.map((l) => (
            <div key={l.listing_id} className="flex items-center justify-between gap-2 border border-white/6 rounded-md px-3 py-2">
              <div className="text-xs text-[oklch(0.80_0.008_80)]" style={outfit}>
                <span className="font-semibold text-white">{formatDate(l.date)}</span>
                {" · "}
                <span className="text-gold-gradient font-semibold">{formatMXN(l.price)}</span>
                {l.description && <span className="text-[oklch(0.58_0.010_260)]"> · {l.description}</span>}
              </div>
              <button
                onClick={() => removeListing(l.date)}
                aria-label="Eliminar publicación"
                className="text-[oklch(0.50_0.008_260)] hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      <ListingForm box={box} onDone={refresh} />
    </div>
  );
}
