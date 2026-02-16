import { useState, useEffect } from "react";
import api from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, Leaf, DollarSign, Users, BarChart3, AlertCircle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

const METRIC_ICONS = {
  feasibility: BarChart3,
  cost: DollarSign,
  environmental: Leaf,
  social: Users,
};
const METRIC_COLORS = {
  feasibility: "#2E7D32",
  cost: "#FF9800",
  environmental: "#81C784",
  social: "#0288D1",
};
const BAR_COLORS = ["#2E7D32", "#81C784", "#FF9800"];

export default function Evaluation() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        const res = await api.get("/evaluation");
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvaluation();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2E7D32] border-t-transparent" />
      </div>
    );
  }

  if (!data?.data_sufficient) {
    return (
      <div className="space-y-6" data-testid="evaluation-page">
        <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight">Evaluation Engine</h1>
        <Card className="bg-white rounded-xl border border-gray-100">
          <CardContent className="flex flex-col items-center py-16">
            <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">Insufficient data to evaluate</p>
            <p className="text-gray-400 text-sm mt-1">Add more listings and complete pickups to generate evaluation</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const chartData = (data?.models || []).map((m) => ({
    name: m.name,
    overall: m.overall,
    feasibility: m.feasibility,
    cost: m.cost,
    environmental: m.environmental,
    social: m.social,
  }));

  return (
    <div className="space-y-8" data-testid="evaluation-page">
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight">Evaluation Engine</h1>
        <p className="text-gray-500 mt-1">
          Analyzing redistribution models using weighted scoring:
          <span className="ml-1 text-[#2E7D32] font-medium">
            Feasibility(0.3) + Environmental(0.3) + Cost(0.2) + Social(0.2)
          </span>
        </p>
      </div>

      {/* Model Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(data?.models || []).map((model) => {
          const isRecommended = model.name === data?.recommended;
          return (
            <Card
              key={model.name}
              data-testid={`eval-model-${model.name.replace(/\s+/g, '-').toLowerCase()}`}
              className={`bg-white rounded-xl border shadow-sm transition-all duration-200 ${
                isRecommended
                  ? "border-[#2E7D32] ring-2 ring-[#2E7D32]/20 shadow-md"
                  : "border-gray-100 hover:border-[#2E7D32]/30 hover:shadow-md"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{model.name}</CardTitle>
                  {isRecommended && (
                    <Badge className="bg-[#2E7D32] text-white border-0">
                      <Award className="w-3 h-3 mr-1" /> Recommended
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{model.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {["feasibility", "cost", "environmental", "social"].map((metric) => {
                  const Icon = METRIC_ICONS[metric];
                  const color = METRIC_COLORS[metric];
                  const value = model[metric];
                  return (
                    <div key={metric}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" style={{ color }} />
                          <span className="text-sm font-medium capitalize text-gray-700">{metric}</span>
                        </div>
                        <span className="text-sm font-semibold" style={{ color }}>{value}%</span>
                      </div>
                      <Progress value={value} className="h-2" style={{ "--progress-bg": color }} />
                    </div>
                  );
                })}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#0F172A]">Overall Score</span>
                    <span className="text-2xl font-bold text-[#2E7D32]">{model.overall}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Comparison Chart */}
      <Card className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Model Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    border: "none"
                  }}
                />
                <Bar dataKey="feasibility" name="Feasibility" fill="#2E7D32" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cost" name="Cost" fill="#FF9800" radius={[4, 4, 0, 0]} />
                <Bar dataKey="environmental" name="Environmental" fill="#81C784" radius={[4, 4, 0, 0]} />
                <Bar dataKey="social" name="Social" fill="#0288D1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
