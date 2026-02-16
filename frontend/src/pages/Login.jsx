import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Leaf, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({
    email: "", password: "", role: "donor", org_name: "", service_area: "", phone: ""
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      toast.error("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regForm.email || !regForm.password || !regForm.org_name) {
      toast.error("Please fill required fields");
      return;
    }
    if (regForm.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register(regForm);
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-[#2E7D32] flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">MealBridge</h1>
          </div>

          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-[#F1F8E9]">
              <TabsTrigger value="login" data-testid="login-tab" className="data-[state=active]:bg-[#2E7D32] data-[state=active]:text-white">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="register" data-testid="register-tab" className="data-[state=active]:bg-[#2E7D32] data-[state=active]:text-white">
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="border-0 shadow-none">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-2xl">Welcome back</CardTitle>
                  <CardDescription>Sign in to continue managing food redistribution</CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        data-testid="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        data-testid="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      />
                    </div>
                    <Button
                      type="submit"
                      data-testid="login-submit"
                      disabled={loading}
                      className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white h-11"
                    >
                      {loading ? "Signing in..." : "Sign In"}
                      {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="border-0 shadow-none">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-2xl">Create account</CardTitle>
                  <CardDescription>Join the food redistribution network</CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-role">I am a</Label>
                      <Select
                        value={regForm.role}
                        onValueChange={(v) => setRegForm({ ...regForm, role: v })}
                      >
                        <SelectTrigger data-testid="register-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="donor">Food Donor</SelectItem>
                          <SelectItem value="ngo">NGO / Charity</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-org">Organization Name *</Label>
                      <Input
                        id="reg-org"
                        data-testid="register-org"
                        placeholder="Your organization"
                        value={regForm.org_name}
                        onChange={(e) => setRegForm({ ...regForm, org_name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="reg-email">Email *</Label>
                        <Input
                          id="reg-email"
                          data-testid="register-email"
                          type="email"
                          placeholder="you@org.com"
                          value={regForm.email}
                          onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-phone">Phone</Label>
                        <Input
                          id="reg-phone"
                          data-testid="register-phone"
                          placeholder="+91..."
                          value={regForm.phone}
                          onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password *</Label>
                      <Input
                        id="reg-password"
                        data-testid="register-password"
                        type="password"
                        placeholder="Min 6 characters"
                        value={regForm.password}
                        onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-area">Service Area</Label>
                      <Input
                        id="reg-area"
                        data-testid="register-area"
                        placeholder="e.g. New Delhi"
                        value={regForm.service_area}
                        onChange={(e) => setRegForm({ ...regForm, service_area: e.target.value })}
                      />
                    </div>
                    <Button
                      type="submit"
                      data-testid="register-submit"
                      disabled={loading}
                      className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white h-11"
                    >
                      {loading ? "Creating..." : "Create Account"}
                      {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right - Hero */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1691095744255-0fc8e93c4639?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjd8MHwxfHNlYXJjaHw0fHxmcmVzaCUyMHZlZ2V0YWJsZXMlMjBib3glMjB3b29kZW4lMjBjcmF0ZXxlbnwwfHx8fDE3NzEyNTQ2MjN8MA&ixlib=rb-4.1.0&q=85"
          alt="Fresh organic vegetables"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            Reduce Waste.<br />Feed Communities.
          </h2>
          <p className="text-lg text-white/80 max-w-md leading-relaxed">
            Connect surplus food with those in need. Track donations, manage pickups,
            and measure your environmental impact.
          </p>
          <div className="flex gap-8 mt-8">
            <div>
              <p className="text-3xl font-bold">2x</p>
              <p className="text-sm text-white/70">Meals per kg donated</p>
            </div>
            <div>
              <p className="text-3xl font-bold">2.5kg</p>
              <p className="text-sm text-white/70">CO2 saved per kg</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
