import {
  Building2,
  Users as UsersIcon,
  TrendingUp,
  Zap,
  CreditCard,
  BarChart2,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Row 2: Subscription revenue trend
const revenueData = [
  { month: "T1", revenue: 125000000 },
  { month: "T2", revenue: 158000000 },
  { month: "T3", revenue: 182000000 },
  { month: "T4", revenue: 210000000 },
  { month: "T5", revenue: 245000000 },
  { month: "T6", revenue: 273000000 },
];

// Row 3: Plan distribution (donut)
const planDistributionData = [
  { name: "Free Tier", value: 4210, color: "#a3a3a3" },
  { name: "Small Business", value: 2850, color: "#3b82f6" },
  { name: "Premium Business", value: 1120, color: "#1EC8A5" },
];

// Row 3: Revenue by plan (bar)
const planRevenueData = [
  { plan: "Free Tier", revenue: 0 },
  { plan: "Small Business", revenue: 142500000 },
  { plan: "Premium Business", revenue: 224000000 },
];

// Row 4: Household growth (line)
const householdGrowthData = [
  { month: "T1", households: 1820 },
  { month: "T2", households: 2010 },
  { month: "T3", households: 2180 },
  { month: "T4", households: 2320 },
  { month: "T5", households: 2430 },
  { month: "T6", households: 2547 },
];

// Row 4: Conversion funnel
const funnelData = [
  { label: "Tổng người dùng", value: 8932, color: "#a3a3a3", pct: 100 },
  { label: "Free Tier", value: 4210, color: "#3b82f6", pct: 47 },
  { label: "Small Business", value: 2850, color: "#8b5cf6", pct: 32 },
  { label: "Premium Business", value: 1120, color: "#1EC8A5", pct: 13 },
];

export default function ComprehensiveDashboard() {
  return (
    <div className="space-y-6">
      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Hộ kinh doanh đang hoạt động</p>
              <h3 className="text-3xl font-semibold mt-2 text-card-foreground">2,547</h3>
              <p className="text-sm text-green-500 mt-2">+12.5% vs tháng trước</p>
            </div>
            <div className="bg-primary/10 p-3 rounded-lg">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Người dùng trả phí</p>
              <h3 className="text-3xl font-semibold mt-2 text-card-foreground">3,970</h3>
              <p className="text-sm text-green-500 mt-2">+9.4% vs tháng trước</p>
            </div>
            <div className="bg-blue-500/10 p-3 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Doanh thu tháng</p>
              <h3 className="text-3xl font-semibold mt-2 text-card-foreground">273M</h3>
              <p className="text-sm text-green-500 mt-2">+18.2% vs tháng trước</p>
            </div>
            <div className="bg-yellow-500/10 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Truy vấn AI hôm nay</p>
              <h3 className="text-3xl font-semibold mt-2 text-card-foreground">3,856</h3>
              <p className="text-sm text-green-500 mt-2">+24% vs hôm qua</p>
            </div>
            <div className="bg-purple-500/10 p-3 rounded-lg">
              <Zap className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Full-width Subscription Revenue Trend */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">
              Xu hướng doanh thu Subscription
            </h2>
            <p className="text-sm text-muted-foreground">6 tháng gần nhất</p>
          </div>
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="colorRevenueTrend" x1="0" y1="0" x2="0" y2="1">
                <stop key="top" offset="5%" stopColor="#1EC8A5" stopOpacity={0.3} />
                <stop key="bottom" offset="95%" stopColor="#1EC8A5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis dataKey="month" stroke="#a3a3a3" tick={{ fill: "#a3a3a3", fontSize: 12 }} />
            <YAxis stroke="#a3a3a3" tick={{ fill: "#a3a3a3", fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px" }}
              labelStyle={{ color: "#f5f5f5" }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#1EC8A5"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenueTrend)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Row 3: Plan Distribution (Donut) + Revenue by Plan (Bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">Phân bố gói dịch vụ</h2>
              <p className="text-sm text-muted-foreground">Theo số lượng người dùng</p>
            </div>
            <BarChart2 className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="55%" height={220}>
              <PieChart>
                <Pie
                  data={planDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {planDistributionData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px" }}
                  labelStyle={{ color: "#f5f5f5" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {planDistributionData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-card-foreground">
                    {item.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">Doanh thu theo gói</h2>
              <p className="text-sm text-muted-foreground">VNĐ / tháng hiện tại</p>
            </div>
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={planRevenueData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="plan" stroke="#a3a3a3" tick={{ fill: "#a3a3a3", fontSize: 11 }} />
              <YAxis stroke="#a3a3a3" tick={{ fill: "#a3a3a3", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px" }}
                labelStyle={{ color: "#f5f5f5" }}
              />
              <Bar dataKey="revenue" name="Doanh thu" radius={[8, 8, 0, 0]}>
                {planRevenueData.map((entry) => {
                  const colors = ["#a3a3a3", "#3b82f6", "#1EC8A5"];
                  const idx = planRevenueData.indexOf(entry);
                  return <Cell key={entry.plan} fill={colors[idx]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 4: Household Growth (Line) + Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">Tăng trưởng hộ kinh doanh</h2>
              <p className="text-sm text-muted-foreground">Số hộ đang hoạt động theo tháng</p>
            </div>
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={householdGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="month" stroke="#a3a3a3" tick={{ fill: "#a3a3a3", fontSize: 12 }} />
              <YAxis stroke="#a3a3a3" tick={{ fill: "#a3a3a3", fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px" }}
                labelStyle={{ color: "#f5f5f5" }}
              />
              <Line
                type="monotone"
                dataKey="households"
                stroke="#1EC8A5"
                strokeWidth={2}
                dot={{ fill: "#1EC8A5", r: 4 }}
                name="Hộ kinh doanh"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">Phễu chuyển đổi người dùng</h2>
              <p className="text-sm text-muted-foreground">Từ đăng ký đến trả phí</p>
            </div>
            <UsersIcon className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-3 mt-2">
            {funnelData.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold text-card-foreground">
                    {item.value.toLocaleString()}
                    <span className="text-muted-foreground font-normal ml-1">({item.pct}%)</span>
                  </span>
                </div>
                <div className="h-8 bg-border/40 rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all"
                    style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
