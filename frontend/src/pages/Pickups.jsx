import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Truck, CheckCircle2, ArrowRight, Clock, Package, MapPin } from "lucide-react";
import { toast } from "sonner";

const STATUS_FLOW = ["pending", "accepted", "en_route", "collected", "delivered"];
const STATUS_LABELS = {
  pending: "Pending",
  accepted: "Accepted",
  en_route: "En Route",
  collected: "Collected",
  delivered: "Delivered"
};
const STATUS_COLORS = {
  pending: "bg-orange-100 text-orange-800 border-orange-200",
  accepted: "bg-blue-100 text-blue-800 border-blue-200",
  en_route: "bg-indigo-100 text-indigo-800 border-indigo-200",
  collected: "bg-teal-100 text-teal-800 border-teal-200",
  delivered: "bg-green-100 text-green-800 border-green-200"
};

function StatusTimeline({ pickup }) {
  const currentIdx = STATUS_FLOW.indexOf(pickup.status);
  return (
    <div className="flex items-center gap-1 mt-3">
      {STATUS_FLOW.map((s, i) => {
        const done = i <= currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                done ? "bg-[#2E7D32] text-white" : "bg-gray-100 text-gray-400"
              } ${isCurrent ? "ring-2 ring-[#2E7D32]/30" : ""}`}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-[10px] mt-1 ${done ? "text-[#2E7D32] font-medium" : "text-gray-400"}`}>
                {STATUS_LABELS[s]}
              </span>
            </div>
            {i < STATUS_FLOW.length - 1 && (
              <div className={`w-6 h-0.5 mx-0.5 mb-4 ${i < currentIdx ? "bg-[#2E7D32]" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Pickups() {
  const { user } = useAuth();
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updateDialog, setUpdateDialog] = useState(null);
  const [redistDialog, setRedistDialog] = useState(null);
  const [notes, setNotes] = useState("");
  const [redistForm, setRedistForm] = useState({ beneficiaries_count: "", portion_size: "0.5", notes: "" });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPickups = async () => {
    try {
      const res = await api.get("/pickups");
      setPickups(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPickups(); }, []);

  const getNextStatus = (current) => {
    const idx = STATUS_FLOW.indexOf(current);
    return idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
  };

  const handleUpdateStatus = async () => {
    if (!updateDialog) return;
    const next = getNextStatus(updateDialog.status);
    if (!next) return;
    setActionLoading(true);
    try {
      await api.put(`/pickups/${updateDialog.id}/status`, { status: next, notes });
      toast.success(`Status updated to ${STATUS_LABELS[next]}`);
      setUpdateDialog(null);
      setNotes("");
      fetchPickups();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRedistribution = async () => {
    if (!redistDialog) return;
    setActionLoading(true);
    try {
      await api.post(`/pickups/${redistDialog.id}/redistribution`, {
        beneficiaries_count: Number(redistForm.beneficiaries_count),
        portion_size: Number(redistForm.portion_size),
        notes: redistForm.notes
      });
      toast.success("Redistribution logged!");
      setRedistDialog(null);
      setRedistForm({ beneficiaries_count: "", portion_size: "0.5", notes: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to log redistribution");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2E7D32] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="pickups-page">
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight">
          {user?.role === "ngo" ? "My Pickups" : "Pickup Status"}
        </h1>
        <p className="text-gray-500 mt-1">Track and manage food pickups</p>
      </div>

      {pickups.length === 0 ? (
        <Card className="bg-white rounded-xl border border-gray-100">
          <CardContent className="flex flex-col items-center py-16">
            <div className="w-16 h-16 rounded-full bg-[#E8F5E9] flex items-center justify-center mb-4">
              <Truck className="w-8 h-8 text-[#2E7D32]" />
            </div>
            <p className="text-gray-500">No pickups yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pickups.map((pickup) => {
            const next = getNextStatus(pickup.status);
            return (
              <Card
                key={pickup.id}
                data-testid={`pickup-card-${pickup.id}`}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[#0F172A] text-lg">{pickup.listing_name}</h3>
                        <Badge variant="outline" className={STATUS_COLORS[pickup.status]}>
                          {STATUS_LABELS[pickup.status]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5" /> {pickup.listing_quantity} kg
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {pickup.created_at?.slice(0, 10)}
                        </span>
                      </div>
                      {user?.role !== "ngo" && (
                        <p className="text-sm text-gray-500">NGO: {pickup.ngo_name}</p>
                      )}
                      {user?.role !== "donor" && (
                        <p className="text-sm text-gray-500">Donor: {pickup.donor_name}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {(user?.role === "ngo" || user?.role === "admin") && next && (
                        <Button
                          size="sm"
                          onClick={() => setUpdateDialog(pickup)}
                          data-testid={`update-status-btn-${pickup.id}`}
                          className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white"
                        >
                          {STATUS_LABELS[next]} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      )}
                      {user?.role === "ngo" && pickup.status === "delivered" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRedistDialog(pickup)}
                          data-testid={`redist-btn-${pickup.id}`}
                          className="border-[#2E7D32] text-[#2E7D32]"
                        >
                          Log Redistribution
                        </Button>
                      )}
                    </div>
                  </div>

                  <StatusTimeline pickup={pickup} />

                  {/* Timestamps */}
                  {pickup.timestamps && (
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-400">
                      {Object.entries(pickup.timestamps).map(([key, val]) =>
                        val ? (
                          <span key={key}>
                            {STATUS_LABELS[key]}: {val.slice(0, 16).replace("T", " ")}
                          </span>
                        ) : null
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Update Status Dialog */}
      <Dialog open={!!updateDialog} onOpenChange={() => setUpdateDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Pickup Status</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Move <strong>{updateDialog?.listing_name}</strong> to{" "}
            <Badge className="bg-[#E8F5E9] text-[#2E7D32]">
              {STATUS_LABELS[getNextStatus(updateDialog?.status)]}
            </Badge>
          </p>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              data-testid="status-update-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialog(null)}>Cancel</Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={actionLoading}
              data-testid="confirm-status-update"
              className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white"
            >
              {actionLoading ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redistribution Dialog */}
      <Dialog open={!!redistDialog} onOpenChange={() => setRedistDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Redistribution</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Beneficiaries Count *</Label>
              <Input
                data-testid="redist-beneficiaries"
                type="number"
                value={redistForm.beneficiaries_count}
                onChange={(e) => setRedistForm({ ...redistForm, beneficiaries_count: e.target.value })}
                placeholder="Number of people served"
              />
            </div>
            <div className="space-y-2">
              <Label>Portion Size (kg)</Label>
              <Input
                data-testid="redist-portion"
                type="number"
                step="0.1"
                value={redistForm.portion_size}
                onChange={(e) => setRedistForm({ ...redistForm, portion_size: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                data-testid="redist-notes"
                value={redistForm.notes}
                onChange={(e) => setRedistForm({ ...redistForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRedistDialog(null)}>Cancel</Button>
            <Button
              onClick={handleRedistribution}
              disabled={actionLoading}
              data-testid="confirm-redistribution"
              className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white"
            >
              {actionLoading ? "Saving..." : "Log Redistribution"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
