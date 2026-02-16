import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, Building, Save } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    org_name: user?.org_name || "",
    service_area: user?.service_area || "",
    phone: user?.phone || "",
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile(form);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = {
    donor: "Food Donor",
    ngo: "NGO / Charity",
    admin: "Administrator"
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6" data-testid="profile-page">
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight">Profile</h1>
        <p className="text-gray-500 mt-1">Manage your account settings</p>
      </div>

      <Card className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#E8F5E9] flex items-center justify-center">
              <span className="text-2xl font-bold text-[#2E7D32]">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            <div>
              <CardTitle className="text-xl">{user?.org_name || user?.email}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-[#E8F5E9] text-[#2E7D32] border-0 capitalize">
                  {roleLabel[user?.role] || user?.role}
                </Badge>
                <span className="text-sm text-gray-500">{user?.email}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Building className="w-4 h-4 text-gray-400" /> Organization Name
            </Label>
            <Input
              data-testid="profile-org-name"
              value={form.org_name}
              onChange={(e) => setForm({ ...form, org_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" /> Service Area
            </Label>
            <Input
              data-testid="profile-service-area"
              value={form.service_area}
              onChange={(e) => setForm({ ...form, service_area: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" /> Phone
            </Label>
            <Input
              data-testid="profile-phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" /> Email
            </Label>
            <Input value={user?.email || ""} disabled className="bg-gray-50" />
          </div>

          <Button
            onClick={handleSave}
            disabled={loading}
            data-testid="save-profile-btn"
            className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white h-11"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
