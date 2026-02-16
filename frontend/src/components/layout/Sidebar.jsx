import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard, UtensilsCrossed, Plus, Truck, Map, Brain,
  User, LogOut, Leaf, ChevronLeft, Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const donorLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/listings", icon: UtensilsCrossed, label: "My Listings" },
  { to: "/listings/create", icon: Plus, label: "Create Listing" },
  { to: "/pickups", icon: Truck, label: "Pickup Status" },
  { to: "/profile", icon: User, label: "Profile" },
];

const ngoLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/listings", icon: UtensilsCrossed, label: "Available Listings" },
  { to: "/pickups", icon: Truck, label: "My Pickups" },
  { to: "/map", icon: Map, label: "Map View" },
  { to: "/profile", icon: User, label: "Profile" },
];

const adminLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/listings", icon: UtensilsCrossed, label: "All Listings" },
  { to: "/pickups", icon: Truck, label: "All Pickups" },
  { to: "/map", icon: Map, label: "Map View" },
  { to: "/evaluation", icon: Brain, label: "Evaluation" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = user?.role === "admin" ? adminLinks
    : user?.role === "ngo" ? ngoLinks
    : donorLinks;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      data-testid="sidebar"
      className={`${collapsed ? "w-[72px]" : "w-64"} bg-white border-r border-gray-100 flex flex-col h-screen transition-all duration-200 shrink-0`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-100">
        <div className="w-9 h-9 rounded-lg bg-[#2E7D32] flex items-center justify-center shrink-0">
          <Leaf className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-[#0F172A] text-lg tracking-tight truncate">
            MealBridge
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="ml-auto h-8 w-8 shrink-0"
          data-testid="sidebar-toggle"
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            data-testid={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? "bg-[#E8F5E9] text-[#2E7D32]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`
            }
          >
            <link.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="truncate">{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-100 p-3">
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#E8F5E9] flex items-center justify-center">
              <span className="text-sm font-semibold text-[#2E7D32]">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.org_name || user?.email}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={handleLogout}
          data-testid="logout-btn"
          className={`w-full text-gray-600 hover:text-red-600 hover:bg-red-50 ${collapsed ? "px-0 justify-center" : "justify-start"}`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </aside>
  );
}
