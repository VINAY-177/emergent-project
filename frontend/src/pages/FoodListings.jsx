import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, MapPin, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const statusColors = {
  available: "bg-green-100 text-green-800 border-green-200",
  reserved: "bg-orange-100 text-orange-800 border-orange-200",
  picked_up: "bg-blue-100 text-blue-800 border-blue-200",
  delivered: "bg-purple-100 text-purple-800 border-purple-200",
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  expired: "bg-red-100 text-red-800 border-red-200",
};

export default function FoodListings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [claimDialog, setClaimDialog] = useState(null);
  const [claimLoading, setClaimLoading] = useState(false);

useEffect(() => {
  const fetchListings = async () => {
    try {
      const params = {};
      if (user?.role === "donor") params.donor_id = user.id;
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await api.get("/listings", { params });
      setListings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  fetchListings();
}, [statusFilter, user]);


  useEffect(() => {
    fetchListings();
  }, [statusFilter]);

  const handleClaim = async () => {
    if (!claimDialog) return;
    setClaimLoading(true);
    try {
      await api.post("/pickups", { listing_id: claimDialog.id });
      toast.success("Pickup created! Check your pickups page.");
      setClaimDialog(null);
      fetchListings();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to claim listing");
    } finally {
      setClaimLoading(false);
    }
  };

  const filtered = listings.filter((l) =>
    l.food_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="food-listings-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight">
            {user?.role === "donor" ? "My Listings" : "Food Listings"}
          </h1>
          <p className="text-gray-500 mt-1">
            {user?.role === "ngo" ? "Browse available food for pickup" : "Manage your food listings"}
          </p>
        </div>
        {user?.role === "donor" && (
          <Button
            onClick={() => navigate("/listings/create")}
            data-testid="create-listing-btn"
            className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> New Listing
          </Button>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            data-testid="listings-search"
            placeholder="Search listings..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]" data-testid="listings-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
            <SelectItem value="picked_up">Picked Up</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2E7D32] border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-white rounded-xl border border-gray-100">
          <CardContent className="flex flex-col items-center py-16">
            <div className="w-16 h-16 rounded-full bg-[#E8F5E9] flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-[#2E7D32]" />
            </div>
            <p className="text-gray-500">No listings found</p>
            {user?.role === "donor" && (
              <Button
                onClick={() => navigate("/listings/create")}
                className="mt-4 bg-[#2E7D32] hover:bg-[#1B5E20] text-white"
              >
                Create First Listing
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((listing) => (
            <Card
              key={listing.id}
              data-testid={`listing-card-${listing.id}`}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:border-[#2E7D32]/30 hover:shadow-md transition-all duration-200"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-[#0F172A] text-lg">{listing.food_name}</h3>
                  <div className="flex items-center gap-2">
                    {listing.urgent_flag && (
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                    )}
                    <Badge variant="outline" className={statusColors[listing.status] || statusColors.draft}>
                      {listing.status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="capitalize px-2 py-0.5 bg-[#E8F5E9] text-[#2E7D32] rounded text-xs font-medium">
                      {listing.category}
                    </span>
                    <span>{listing.quantity} kg</span>
                  </div>
                  {listing.pickup_address && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">{listing.pickup_address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>Expires: {listing.expiry_time?.slice(0, 16).replace("T", " ")}</span>
                  </div>
                  {listing.donor_name && user?.role !== "donor" && (
                    <p className="text-xs text-gray-400">By {listing.donor_name}</p>
                  )}
                </div>

                {user?.role === "ngo" && listing.status === "available" && (
                  <Button
                    onClick={() => setClaimDialog(listing)}
                    data-testid={`claim-btn-${listing.id}`}
                    className="w-full mt-4 bg-[#2E7D32] hover:bg-[#1B5E20] text-white"
                    size="sm"
                  >
                    Claim for Pickup
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Claim Dialog */}
      <Dialog open={!!claimDialog} onOpenChange={() => setClaimDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Pickup</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Claim <strong>{claimDialog?.food_name}</strong> ({claimDialog?.quantity} kg) for pickup?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClaimDialog(null)} data-testid="claim-cancel-btn">
              Cancel
            </Button>
            <Button
              onClick={handleClaim}
              disabled={claimLoading}
              data-testid="claim-confirm-btn"
              className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white"
            >
              {claimLoading ? "Claiming..." : "Confirm Pickup"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
