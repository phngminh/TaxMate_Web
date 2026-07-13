import { useEffect, useState } from "react";
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
} from "recharts";
import {
  getActiveBusinesses,
  getBusinessUserTrend,
  getMonthlyRevenue,
  getPackageRevenue,
  getPaidSubscriptions,
  getServicePackageDistribution,
  getSubscriptionTrend,
  getTodayChatMessages,
  getUserConversion,
} from "../../apis/dashboard.api";
import type {
  MomCountMetric,
  MomRevenueMetric,
  UserConversionStage,
} from "../../types/dashboard.type";

const PLAN_COLORS = ["#a3a3a3", "#3b82f6", "#1EC8A5", "#8b5cf6", "#f59e0b"];
const FUNNEL_COLORS = ["#a3a3a3", "#3b82f6", "#8b5cf6", "#1EC8A5", "#f59e0b"];

type ChartPoint = { month: string; value: number };
type PlanSlice = { name: string; value: number; color: string };
type PlanRevenuePoint = { plan: string; revenue: number };
type HouseholdPoint = { month: string; households: number };
type FunnelItem = { label: string; value: number; color: string; pct: number };

function formatDelta(deltaPercent: number | null | undefined) {
  if (deltaPercent == null) return "— vs tháng trước";
  const sign = deltaPercent > 0 ? "+" : "";
  return `${sign}${deltaPercent.toFixed(1)}% vs tháng trước`;
}

function deltaClass(deltaPercent: number | null | undefined) {
  if (deltaPercent == null) return "text-muted-foreground";
  if (deltaPercent > 0) return "text-green-500";
  if (deltaPercent < 0) return "text-red-500";
  return "text-muted-foreground";
}

function formatCompactNumber(value: number) {
  return value.toLocaleString("vi-VN");
}

function formatCompactRevenue(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${Math.round(value / 1_000_000)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return formatCompactNumber(value);
}

export default function ComprehensiveDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeBusinesses, setActiveBusinesses] = useState<MomCountMetric | null>(null);
  const [paidSubscriptions, setPaidSubscriptions] = useState<MomCountMetric | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MomRevenueMetric | null>(null);
  const [todayChats, setTodayChats] = useState(0);
  const [subscriptionTrend, setSubscriptionTrend] = useState<ChartPoint[]>([]);
  const [planDistribution, setPlanDistribution] = useState<PlanSlice[]>([]);
  const [planRevenue, setPlanRevenue] = useState<PlanRevenuePoint[]>([]);
  const [householdGrowth, setHouseholdGrowth] = useState<HouseholdPoint[]>([]);
  const [funnel, setFunnel] = useState<FunnelItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [
          activeRes,
          paidRes,
          revenueRes,
          trendRes,
          distributionRes,
          packageRevenueRes,
          businessTrendRes,
          todayChatRes,
          conversionRes,
        ] = await Promise.all([
          getActiveBusinesses(),
          getPaidSubscriptions(),
          getMonthlyRevenue(),
          getSubscriptionTrend(),
          getServicePackageDistribution(),
          getPackageRevenue(),
          getBusinessUserTrend(),
          getTodayChatMessages(),
          getUserConversion(),
        ]);

        if (cancelled) return;

        if (
          !activeRes.success ||
          !paidRes.success ||
          !revenueRes.success ||
          !trendRes.success ||
          !distributionRes.success ||
          !packageRevenueRes.success ||
          !businessTrendRes.success ||
          !todayChatRes.success ||
          !conversionRes.success
        ) {
          throw new Error(
            activeRes.message ||
              paidRes.message ||
              revenueRes.message ||
              trendRes.message ||
              distributionRes.message ||
              packageRevenueRes.message ||
              businessTrendRes.message ||
              todayChatRes.message ||
              conversionRes.message ||
              "Không tải được dữ liệu dashboard"
          );
        }

        setActiveBusinesses(activeRes.data);
        setPaidSubscriptions(paidRes.data);
        setMonthlyRevenue(revenueRes.data);
        setTodayChats(todayChatRes.data.total);

        setSubscriptionTrend(
          trendRes.data.points.map((point) => ({
            month: point.monthLabel,
            value: point.value,
          }))
        );

        const latestMonth = distributionRes.data.months.at(-1);
        setPlanDistribution(
          (latestMonth?.packages ?? []).map((pkg, index) => ({
            name: pkg.planName,
            value: pkg.count,
            color: PLAN_COLORS[index % PLAN_COLORS.length],
          }))
        );

        setPlanRevenue(
          packageRevenueRes.data.packages.map((pkg) => ({
            plan: pkg.planName,
            revenue: pkg.revenue,
          }))
        );

        setHouseholdGrowth(
          businessTrendRes.data.points.map((point) => ({
            month: point.monthLabel,
            households: point.value,
          }))
        );

        setFunnel(
          conversionRes.data.stages.map((stage: UserConversionStage, index: number) => ({
            label: stage.label,
            value: stage.count,
            pct: Number(stage.percent),
            color: FUNNEL_COLORS[index % FUNNEL_COLORS.length],
          }))
        );
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Không tải được dữ liệu dashboard");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px] text-muted-foreground">
        Đang tải dữ liệu dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[320px] text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Hộ kinh doanh đang hoạt động</p>
              <h3 className="text-3xl font-semibold mt-2 text-card-foreground">
                {formatCompactNumber(activeBusinesses?.currentMonth ?? 0)}
              </h3>
              <p className={`text-sm mt-2 ${deltaClass(activeBusinesses?.deltaPercent)}`}>
                {formatDelta(activeBusinesses?.deltaPercent)}
              </p>
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
              <h3 className="text-3xl font-semibold mt-2 text-card-foreground">
                {formatCompactNumber(paidSubscriptions?.currentMonth ?? 0)}
              </h3>
              <p className={`text-sm mt-2 ${deltaClass(paidSubscriptions?.deltaPercent)}`}>
                {formatDelta(paidSubscriptions?.deltaPercent)}
              </p>
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
              <h3 className="text-3xl font-semibold mt-2 text-card-foreground">
                {formatCompactRevenue(monthlyRevenue?.currentMonth ?? 0)}
              </h3>
              <p className={`text-sm mt-2 ${deltaClass(monthlyRevenue?.deltaPercent)}`}>
                {formatDelta(monthlyRevenue?.deltaPercent)}
              </p>
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
              <h3 className="text-3xl font-semibold mt-2 text-card-foreground">
                {formatCompactNumber(todayChats)}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">Tin nhắn assistant (UTC)</p>
            </div>
            <div className="bg-purple-500/10 p-3 rounded-lg">
              <Zap className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Subscription trend */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">
              Xu hướng đăng ký Subscription
            </h2>
            <p className="text-sm text-muted-foreground">6 tháng gần nhất</p>
          </div>
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={subscriptionTrend}>
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
              dataKey="value"
              name="Số đăng ký"
              stroke="#1EC8A5"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenueTrend)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Row 3: Plan Distribution + Revenue by Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">Phân bố gói dịch vụ</h2>
              <p className="text-sm text-muted-foreground">Theo số lượng đăng ký tháng hiện tại</p>
            </div>
            <BarChart2 className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="55%" height={220}>
              <PieChart>
                <Pie
                  data={planDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {planDistribution.map((entry) => (
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
              {planDistribution.map((item) => (
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
            <BarChart data={planRevenue} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="plan" stroke="#a3a3a3" tick={{ fill: "#a3a3a3", fontSize: 11 }} />
              <YAxis stroke="#a3a3a3" tick={{ fill: "#a3a3a3", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px" }}
                labelStyle={{ color: "#f5f5f5" }}
                formatter={(value) =>
                  typeof value === "number" ? value.toLocaleString("vi-VN") : String(value ?? "")
                }
              />
              <Bar dataKey="revenue" name="Doanh thu" radius={[8, 8, 0, 0]}>
                {planRevenue.map((entry, idx) => (
                  <Cell key={entry.plan} fill={PLAN_COLORS[idx % PLAN_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 4: Household Growth + Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">Tăng trưởng hộ kinh doanh</h2>
              <p className="text-sm text-muted-foreground">Số người dùng có subscription theo tháng</p>
            </div>
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={householdGrowth}>
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
            {funnel.map((item) => (
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
                    style={{ width: `${Math.min(item.pct, 100)}%`, backgroundColor: item.color }}
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
