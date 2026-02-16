import { useState, useEffect } from "react";
import api from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin } from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const STATUS_COLORS_MAP = {
  available: "#2E7D32",
  reserved: "#FF9800",
  picked_up: "#0288D1",
  delivered: "#7B1FA2",
  draft: "#9E9E9E",
};

export default function MapView() {
  const [listings, setListings] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const params = {};
        if (filter !== "all") params.status = filter;
        const res = await api.get("/listings", { params });
        setListings(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [filter]);

  const validListings = listings.filter(
    (l) => l.location?.lat && l.location?.lng
  );

  const center = validListings.length > 0
    ? [validListings[0].location.lat, validListings[0].location.lng]
    : [28.6139, 77.2090];

  return (
    <div className="space-y-6" data-testid="map-view-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight">Map View</h1>
          <p className="text-gray-500 mt-1">Visualize food listings near you</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px]" data-testid="map-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
            <SelectItem value="picked_up">Picked Up</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(STATUS_COLORS_MAP).slice(0, 4).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="capitalize">{status.replace("_", " ")}</span>
          </div>
        ))}
      </div>

      <Card className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="h-[500px]" data-testid="leaflet-map">
            {!loading && (
              <MapContainer
                center={center}
                zoom={12}
                style={{ height: "100%", width: "100%" }}
                zoomControl={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                {validListings.map((listing) => (
                  <CircleMarker
                    key={listing.id}
                    center={[listing.location.lat, listing.location.lng]}
                    radius={listing.urgent_flag ? 10 : 7}
                    pathOptions={{
                      color: STATUS_COLORS_MAP[listing.status] || "#9E9E9E",
                      fillColor: STATUS_COLORS_MAP[listing.status] || "#9E9E9E",
                      fillOpacity: 0.7,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="text-sm min-w-[180px]">
                        <p className="font-semibold text-[#0F172A] text-base">{listing.food_name}</p>
                        <p className="text-gray-500 mt-1 capitalize">{listing.category} - {listing.quantity} kg</p>
                        <p className="text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {listing.pickup_address || "No address"}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">By {listing.donor_name}</p>
                        <div className="mt-2">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${STATUS_COLORS_MAP[listing.status]}20`,
                              color: STATUS_COLORS_MAP[listing.status]
                            }}
                          >
                            {listing.status}
                          </span>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Listings count */}
      <p className="text-sm text-gray-500">
        Showing {validListings.length} listing{validListings.length !== 1 ? "s" : ""} on map
      </p>
    </div>
  );
}
