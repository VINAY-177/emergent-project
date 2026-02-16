import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import api from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package, Truck, UtensilsCrossed, Wind, Users, Clock, Leaf, TrendingUp
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from "recharts";

const COLORS = ["#2E7D32", "#81C784", "#FF9800", "#FDD835", "#AED581"];

function KPICard({ title, value, icon: Icon, color = "#2E7D32", subtitle }) {
  return (
    <Card className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <p className="text-3xl font-bold mt-2 text-[#0F172A]">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          </div>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DonorDashboard({ dashboard, charts }) {
  const kpis = dashboard?.kpis || {};
  return (
    <div data-testid="donor-dashboard" className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight">Donor Dashboard</h1>
        <p className="text-gray-500 mt-1">Track your food donations and impact</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard title="Total Donated" value={`${kpis.total_donated_kg || 0} kg`} icon={Package} />
        <KPICard title="Completed Pickups" value={kpis.completed_pickups || 0} icon={Truck} color="#FF9800" />
        <KPICard title="Meals Served" value={kpis.meals_served || 0} icon={UtensilsCrossed} color="#81C784" />
        <KPICard title="CO2 Avoided" value={`${kpis.co2_avoided_kg || 0} kg`} icon={Wind} color="#0288D1" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#2E7D32]" />
              Donations Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts?.donations_over_time?.slice(-14) || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", border: "none" }} />
                  <Line type="monotone" dataKey="quantity" stroke="#2E7D32" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts?.category_distribution || []}
                    dataKey="quantity"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ category }) => category}
                  >
                    {(charts?.category_distribution || []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Listings */}
      <Card className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Recent Listings</CardTitle>
        </CardHeader>
        <CardContent>
          {(dashboard?.recent_listings || []).length === 0 ? (
            <p className="text-gray-400 text-sm py-4">No listings yet. Create your first food listing!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Food</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Category</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Qty (kg)</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Status</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashboard?.recent_listings || []).slice(0, 5).map((l) => (
                    <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 px-2 font-medium text-[#0F172A]">{l.food_name}</td>
                      <td className="py-3 px-2 capitalize text-gray-600">{l.category}</td>
                      <td className="py-3 px-2 text-gray-600">{l.quantity}</td>
                      <td className="py-3 px-2">
                        <Badge variant="outline" className={
                          l.status === "available" ? "bg-green-100 text-green-800 border-green-200" :
                          l.status === "reserved" ? "bg-orange-100 text-orange-800 border-orange-200" :
                          "bg-gray-100 text-gray-800 border-gray-200"
                        }>
                          {l.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-gray-500">{l.created_at?.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NgoDashboard({ dashboard, charts }) {
  const kpis = dashboard?.kpis || {};
  return (
    <div data-testid="ngo-dashboard" className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight">NGO Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage pickups and track your impact</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard title="Pickups Completed" value={kpis.pickups_completed || 0} icon={Truck} />
        <KPICard title="Pending Pickups" value={kpis.pending_pickups || 0} icon={Clock} color="#FF9800" />
        <KPICard title="Beneficiaries Served" value={kpis.beneficiaries_served || 0} icon={Users} color="#81C784" />
        <KPICard title="CO2 Avoided" value={`${kpis.co2_avoided_kg || 0} kg`} icon={Wind} color="#0288D1" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Collection Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts?.donations_over_time?.slice(-14) || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", border: "none" }} />
                  <Bar dataKey="quantity" fill="#2E7D32" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent Pickups</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(dashboard?.recent_pickups || []).length === 0 ? (
              <p className="text-gray-400 text-sm">No pickups yet</p>
            ) : (
              (dashboard?.recent_pickups || []).slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-[#0F172A]">{p.listing_name}</p>
                    <p className="text-xs text-gray-500">{p.donor_name}</p>
                  </div>
                  <Badge variant="outline" className={
                    p.status === "delivered" ? "bg-green-100 text-green-800 border-green-200" :
                    p.status === "pending" ? "bg-orange-100 text-orange-800 border-orange-200" :
                    "bg-blue-100 text-blue-800 border-blue-200"
                  }>
                    {p.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AdminDashboard({ dashboard, charts }) {
  const kpis = dashboard?.kpis || {};
  return (
    <div data-testid="admin-dashboard" className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Platform overview and monitoring</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <KPICard title="Food Recovered" value={`${kpis.total_food_recovered_kg || 0} kg`} icon={Package} />
        <KPICard title="Active Donors" value={kpis.active_donors || 0} icon={Users} color="#FF9800" />
        <KPICard title="Active NGOs" value={kpis.active_ngos || 0} icon={Leaf} color="#81C784" />
        <KPICard title="Pending Pickups" value={kpis.pending_pickups || 0} icon={Truck} color="#F59E0B" />
        <KPICard title="CO2 Saved" value={`${kpis.total_co2_saved_kg || 0} kg`} icon={Wind} color="#0288D1" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#2E7D32]" />
              Food Recovery Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts?.donations_over_time?.slice(-14) || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", border: "none" }} />
                  <Line type="monotone" dataKey="quantity" stroke="#2E7D32" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Top Donors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts?.top_donors?.slice(0, 5) || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="donor_name" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip contentStyle={{ borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", border: "none" }} />
                  <Bar dataKey="total_kg" fill="#81C784" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Category Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.category_distribution || []}
                  dataKey="quantity"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ category, quantity }) => `${category}: ${quantity}kg`}
                >
                  {(charts?.category_distribution || []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, chartRes] = await Promise.all([
          api.get("/analytics/dashboard"),
          api.get("/analytics/charts")
        ]);
        setDashboard(dashRes.data);
        setCharts(chartRes.data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2E7D32] border-t-transparent" />
      </div>
    );
  }

  if (user?.role === "ngo") return <NgoDashboard dashboard={dashboard} charts={charts} />;
  if (user?.role === "admin") return <AdminDashboard dashboard={dashboard} charts={charts} />;
  return <DonorDashboard dashboard={dashboard} charts={charts} />;
}
