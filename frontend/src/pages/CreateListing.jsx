import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Send } from "lucide-react";
import { toast } from "sonner";

export default function CreateListing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    food_name: "",
    category: "cooked",
    quantity: "",
    preparation_time: "",
    expiry_time: "",
    storage_condition: "room_temp",
    pickup_address: "",
    latitude: "28.6139",
    longitude: "77.2090",
    urgent_flag: false,
  });

  const update = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const validate = () => {
    if (!form.food_name.trim()) return "Food name is required";
    if (!form.quantity || Number(form.quantity) <= 0) return "Quantity must be > 0";
    if (!form.expiry_time) return "Expiry time is required";
    const expiry = new Date(form.expiry_time);
    if (expiry <= new Date()) return "Expiry must be in the future";
    return null;
  };

  const handleSubmit = async (status) => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    setLoading(true);
    try {
      await api.post("/listings", {
        ...form,
        quantity: Number(form.quantity),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        status,
      });
      toast.success(status === "draft" ? "Saved as draft" : "Listing published!");
      navigate("/listings");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6" data-testid="create-listing-page">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/listings")}
          data-testid="back-to-listings"
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight">Create Food Listing</h1>
          <p className="text-gray-500 mt-0.5">Share surplus food with those in need</p>
        </div>
      </div>

      <Card className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <CardContent className="p-6 space-y-6">
          {/* Food Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#0F172A]">Food Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="food_name">Food Name *</Label>
                <Input
                  id="food_name"
                  data-testid="listing-food-name"
                  placeholder="e.g. Cooked Rice, Bread Loaves"
                  value={form.food_name}
                  onChange={(e) => update("food_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => update("category", v)}>
                  <SelectTrigger data-testid="listing-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cooked">Cooked Food</SelectItem>
                    <SelectItem value="raw">Raw Ingredients</SelectItem>
                    <SelectItem value="packaged">Packaged</SelectItem>
                    <SelectItem value="bakery">Bakery</SelectItem>
                    <SelectItem value="dairy">Dairy</SelectItem>
                    <SelectItem value="fruits_vegetables">Fruits & Vegetables</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity (kg) *</Label>
                <Input
                  id="quantity"
                  data-testid="listing-quantity"
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="e.g. 10"
                  value={form.quantity}
                  onChange={(e) => update("quantity", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Storage Condition</Label>
                <Select value={form.storage_condition} onValueChange={(v) => update("storage_condition", v)}>
                  <SelectTrigger data-testid="listing-storage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="room_temp">Room Temperature</SelectItem>
                    <SelectItem value="refrigerated">Refrigerated</SelectItem>
                    <SelectItem value="frozen">Frozen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prep_time">Preparation Time</Label>
                <Input
                  id="prep_time"
                  data-testid="listing-prep-time"
                  type="datetime-local"
                  value={form.preparation_time}
                  onChange={(e) => update("preparation_time", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry_time">Expiry Time *</Label>
                <Input
                  id="expiry_time"
                  data-testid="listing-expiry-time"
                  type="datetime-local"
                  value={form.expiry_time}
                  onChange={(e) => update("expiry_time", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Pickup Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#0F172A]">Pickup Location</h3>
            <div className="space-y-2">
              <Label htmlFor="address">Pickup Address</Label>
              <Textarea
                id="address"
                data-testid="listing-address"
                placeholder="Full address for pickup"
                value={form.pickup_address}
                onChange={(e) => update("pickup_address", e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lat">Latitude</Label>
                <Input
                  id="lat"
                  data-testid="listing-latitude"
                  type="number"
                  step="0.0001"
                  value={form.latitude}
                  onChange={(e) => update("latitude", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng">Longitude</Label>
                <Input
                  id="lng"
                  data-testid="listing-longitude"
                  type="number"
                  step="0.0001"
                  value={form.longitude}
                  onChange={(e) => update("longitude", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Urgent Toggle */}
          <div className="flex items-center justify-between p-4 bg-[#FFF3E0] rounded-lg">
            <div>
              <p className="font-medium text-[#0F172A]">Mark as Urgent</p>
              <p className="text-sm text-gray-500">Prioritize this listing for immediate pickup</p>
            </div>
            <Switch
              data-testid="listing-urgent"
              checked={form.urgent_flag}
              onCheckedChange={(v) => update("urgent_flag", v)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => handleSubmit("draft")}
              disabled={loading}
              data-testid="save-draft-btn"
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" /> Save Draft
            </Button>
            <Button
              onClick={() => handleSubmit("available")}
              disabled={loading}
              data-testid="publish-listing-btn"
              className="flex-1 bg-[#2E7D32] hover:bg-[#1B5E20] text-white"
            >
              <Send className="w-4 h-4 mr-2" /> Publish Listing
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
