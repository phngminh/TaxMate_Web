import imgLogo from './../../assets/logo3.png'
import imgRobot from './../../assets/AI.png'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const revenueData = [
  { date: '26/05', revenue: 5000, trend: 4800 },
  { date: '29/05', revenue: 6500, trend: 5200 },
  { date: '01/06', revenue: 4300, trend: 5400 },
  { date: '04/06', revenue: 5800, trend: 5600 },
  { date: '07/06', revenue: 7300, trend: 5900 },
  { date: '10/06', revenue: 5000, trend: 6000 },
  { date: '13/06', revenue: 8100, trend: 6200 },
  { date: '16/06', revenue: 5800, trend: 6350 },
  { date: '19/06', revenue: 6500, trend: 6500 },
  { date: '22/06', revenue: 7300, trend: 6600 },
  { date: '25/06', revenue: 6350, trend: 6700 },
]

const donutData = [
  { name: 'Đồ uống', value: 55.2, color: '#7c3aed' },
  { name: 'Đồ ăn', value: 34.1, color: '#22c55e' },
  { name: 'Dịch vụ', value: 8.7, color: '#f59e0b' },
  { name: 'Khác', value: 2.0, color: '#e5e7eb' },
]

const topProducts = [
  { name: 'Cà phê đen', amount: '7.250.000₫', pct: 100 },
  { name: 'Cà phê sữa', amount: '6.180.000₫', pct: 85 },
  { name: 'Trà sữa truyền thống', amount: '5.260.000₫', pct: 72 },
  { name: 'Bạc xỉu', amount: '4.120.000₫', pct: 57 },
  { name: 'Trà đào cam sả', amount: '3.760.000₫', pct: 52 },
]

function TrendUpIcon() {
  return (
    <svg width='13' height='13' viewBox='0 0 13 13' fill="none">
      <path
        d='M1 9.5L4.5 6L7 8.5L12 3M12 3H8M12 3V7'
        stroke='#10B981'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

function ClockIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox='0 0 14 14' fill="none">
      <circle cx='7' cy='7' r='6' stroke='#9CA3AF' strokeWidth='1.2' />
      <path d='M7 4V7L9 9' stroke='#9CA3AF' strokeWidth='1.2' strokeLinecap='round' />
    </svg>
  );
}

function CalIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox='0 0 12 12' fill="none">
      <rect x='1' y='2' width='10' height='9' rx='1.5' stroke='#4B5563' strokeWidth='1.2' />
      <path d='M1 5h10' stroke='#4B5563' strokeWidth='1.2' />
      <path d='M4 1v2M8 1v2' stroke='#4B5563' strokeWidth='1.2' strokeLinecap='round' />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width='12' height='12' viewBox='0 0 12 12' fill="none">
      <path d='M2 6h8M7 3l3 3-3 3' stroke='#4F46E5' strokeWidth='1.3' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  )
}

function StatCard({
  color,
  icon,
  label,
  value,
  sub,
  extra,
  miniChart,
}: {
  color: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: React.ReactNode;
  extra?: React.ReactNode;
  miniChart?: React.ReactNode;
}) {
  return (
    <div className='bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.05)] p-5 flex flex-col gap-3 flex-1 min-w-0'>
      <div className='flex items-center gap-3'>
        <div
          className='size-10 rounded-[8px] flex items-center justify-center shrink-0'
          style={{ backgroundColor: color }}
        >
          {icon}
        </div>
        <div className='flex flex-col gap-0.5 min-w-0'>
          <div className='flex items-center gap-1 text-[#6b7280] text-[13px] font-medium'>
            <ClockIcon />
            <span>{label}</span>
          </div>
          <div className='text-[#1a1a1a] text-[22px] font-bold leading-tight'>{value}</div>
        </div>
        {miniChart && <div className='ml-auto shrink-0'>{miniChart}</div>}
      </div>
      {sub && <div className='flex items-center gap-1 text-[13px]'>{sub}</div>}
      {extra && <div className='text-[11px] text-[#9ca3af] leading-tight border-t border-[#f9fafb] pt-2'>{extra}</div>}
    </div>
  )
}

function MiniLineChart({ color }: { color: string }) {
  const data = [
    { v: 3 }, { v: 5 }, { v: 2 }, { v: 6 }, { v: 4 }, { v: 7 }, { v: 5 },
  ];
  return (
    <div style={{ width: 80, height: 40 }}>
      <ResponsiveContainer width='100%' height='100%'>
        <LineChart data={data}>
          <Line type='monotone' dataKey='v' stroke={color} strokeWidth={1.6} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function NavItem({ label, active }: { label: string; active?: boolean }) {
  return (
    <div
      className={`px-4 h-full flex items-center rounded-full text-[14px] font-bold relative shrink-0 ${
        active
          ? "bg-[rgba(253,42,42,0.4)] text-[#910101]"
          : "text-[#1d1d1d] opacity-90"
      }`}
    >
      {label}
      {active && (
        <div className="absolute bottom-[2px] left-[25px] w-[56px] h-[2px] bg-[#910101] rounded-full" />
      )}
    </div>
  );
}

export default function App() {
  return (
    <div className='bg-[#f8f9fa] pt-4 pb-6 min-h-[calc(100vh-51px)]'>
      <div className='px-6'>
        <div className="flex gap-4 mb-6">
          {/* Card 1: Revenue */}
          <div className="bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.05)] p-5 flex flex-col gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-[8px] flex items-center justify-center shrink-0 bg-[#7c3aed]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" fill="white" />
                </svg>
              </div>
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-1 text-[#6b7280] text-[13px] font-medium">
                  <ClockIcon />
                  <span>Doanh thu hôm nay</span>
                </div>
                <div className="text-[#1a1a1a] text-[22px] font-bold leading-tight">6.350.000₫</div>
              </div>
              <MiniLineChart color="#7c3aed" />
            </div>
            <div className="flex items-center gap-1.5 text-[13px]">
              <TrendUpIcon />
              <span className="text-[#9ca3af]">so với hôm qua</span>
              <span className="text-[#10b981] font-medium">18,6%</span>
            </div>
          </div>

          {/* Card 2: Orders */}
          <div className="bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.05)] p-5 flex flex-col gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-[8px] flex items-center justify-center shrink-0 bg-[#22c55e]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" fill="white" />
                </svg>
              </div>
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-1 text-[#6b7280] text-[13px] font-medium">
                  <ClockIcon />
                  <span>Đơn hàng hôm nay</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[#1a1a1a] text-[22px] font-bold leading-tight">128</span>
                  <span className="text-[#9ca3af] text-[13px]">đơn</span>
                </div>
              </div>
              <MiniLineChart color="#22c55e" />
            </div>
            <div className="flex items-center gap-1.5 text-[13px]">
              <TrendUpIcon />
              <span className="text-[#9ca3af]">so với hôm qua</span>
              <span className="text-[#10b981] font-medium">12,5%</span>
            </div>
            <div className="text-[11px] text-[#9ca3af]">Giá trị đơn trung bình: 49.600₫</div>
          </div>

          {/* Card 3: Tax */}
          <div className="bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.05)] p-5 flex flex-col gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-[8px] flex items-center justify-center shrink-0 bg-[#f59e0b]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM9 13h2v5H9zm4-3h2v8h-2zm-8 5h2v3H5z" fill="white" />
                </svg>
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-1 text-[#6b7280] text-[13px] font-medium">
                  <ClockIcon />
                  <span className="whitespace-nowrap">Thuế tạm tính tháng 06/2026</span>
                </div>
                <div className="text-[#1a1a1a] text-[22px] font-bold leading-tight">970.000₫</div>
              </div>
            </div>
            <div className="flex flex-col gap-1 border-t border-[#f9fafb] pt-2">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-[#9ca3af]">GTGT (1%):</span>
                <span className="font-medium text-[#1a1a1a]">727.500₫</span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-[#9ca3af]">TNCN (0,5%):</span>
                <span className="font-medium text-[#1a1a1a]">242.500₫</span>
              </div>
              <div className="text-[11px] text-[#9ca3af] text-center">Dự kiến phải nộp</div>
            </div>
          </div>

          {/* Card 4: Profit */}
          <div className="bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.05)] p-5 flex flex-col gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-[8px] flex items-center justify-center shrink-0 bg-[#3b82f6]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" fill="white" />
                </svg>
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-1 text-[#6b7280] text-[13px] font-medium">
                  <ClockIcon />
                  <span className="whitespace-nowrap">Lợi nhuận tạm tính tháng 06/2026</span>
                </div>
                <div className="text-[#1a1a1a] text-[22px] font-bold leading-tight">12.450.000₫</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[13px]">
              <TrendUpIcon />
              <span className="text-[#9ca3af]">so với tháng trước</span>
              <span className="text-[#10b981] font-medium">21,4%</span>
            </div>
            <div className="flex items-center gap-1 text-[13px] text-[#4f46e5]">
              <span className="font-medium">Biên lợi nhuận:</span>
              <span className="font-bold">25,6%</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          {/* Revenue Chart */}
          <div className="bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.05)] p-6 flex-[684_684_0] min-w-0 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[#1f2937] text-[16px] font-bold">Doanh thu</div>
              <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[8px] flex items-center gap-1.5 px-3 py-1.5 text-[#4b5563] text-[12px]">
                <CalIcon />
                <span>30 ngày qua</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 mb-3 border-b border-[#f3f4f6]">
              <span className="text-[14px] font-bold text-[#ef4444] pb-1.5 border-b-2 border-[#ef4444]">Theo ngày</span>
              <span className="text-[14px] text-[#9ca3af] pb-1.5">Theo tuần</span>
              <span className="text-[14px] text-[#9ca3af] pb-1.5">Theo tháng</span>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-[#7c3aed]" />
                <span className="text-[11px] text-[#6b7280]">Doanh thu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-[#7c3aed] opacity-50" style={{ borderTop: "2px dashed #94A3B8" }} />
                <span className="text-[11px] text-[#6b7280]">Xu hướng</span>
              </div>
            </div>

            {/* Chart */}
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="4 2" stroke="#F3F4F6" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v / 1000}tr`}
                    domain={[0, 10000]}
                    ticks={[0, 2000, 4000, 6000, 8000, 10000]}
                    width={32}
                  />
                  {/* <Tooltip
                    formatter={(v: number) => [`${(v / 1000).toFixed(1)}tr`, ""]}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #eef0f2" }}
                  /> */}
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#7C3AED"
                    strokeWidth={2}
                    dot={{ fill: "#7C3AED", r: 3, stroke: "white", strokeWidth: 2 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="trend"
                    stroke="#94A3B8"
                    strokeWidth={1.5}
                    strokeDasharray="6 3"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue Structure Donut */}
          <div className="bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.05)] p-6 flex-[330_330_0] min-w-0 flex flex-col">
            <div className="text-[#1f2937] text-[16px] font-bold mb-4">Cơ cấu doanh thu</div>

            {/* Donut */}
            <div className="relative flex-1 flex items-center justify-center" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={105}
                    paddingAngle={2}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-[#9ca3af]">Tổng doanh thu</span>
                <span className="text-[13px] font-bold text-[#1a1a1a]">48.500.000₫</span>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-2 flex flex-col gap-2">
              {donutData.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-[12px] text-[#4b5563]">{d.name}</span>
                  </div>
                  <span className="text-[12px] font-bold text-[#1a1a1a]">{d.value.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.05)] p-6 flex-[330_330_0] min-w-0 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[#1f2937] text-[16px] font-bold">Top sản phẩm/dịch vụ</div>
              <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[4px] flex items-center gap-1 px-2 py-1 text-[#4b5563] text-[10px]">
                <CalIcon size={10} />
                <span>30 ngày qua</span>
              </div>
            </div>

            <div className="flex flex-col gap-5 flex-1">
              {topProducts.map((p) => (
                <div key={p.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[#374151]">{p.name}</span>
                    <span className="text-[12px] font-bold text-[#1a1a1a]">{p.amount}</span>
                  </div>
                  <div className="bg-[#f3f4f6] h-[6px] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#7c3aed] rounded-full"
                      style={{ width: `${p.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-[#f9fafb] flex items-center justify-between">
              <ArrowRightIcon />
              <span className="text-[12px] font-medium text-[#4f46e5]">Xem tất cả</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}