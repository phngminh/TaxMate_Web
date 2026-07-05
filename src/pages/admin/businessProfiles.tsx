import { useState } from "react";
import {
  Search, Filter, Building2, MapPin, Receipt, MoreHorizontal,
  ChevronDown, ChevronUp, Eye, Edit, AlertTriangle, CheckCircle2,
  Clock, XCircle, ArrowUpDown, Plus
} from "lucide-react";

const PROVINCES = {
  "01": "Hà Nội", "79": "TP. Hồ Chí Minh", "48": "Đà Nẵng",
  "31": "Hải Phòng", "92": "Cần Thơ", "77": "Bà Rịa - Vũng Tàu",
};

const CATEGORIES = {
  "CAT001": "Bán lẻ thực phẩm", "CAT002": "Dịch vụ ăn uống",
  "CAT003": "May mặc & Thời trang", "CAT004": "Vật liệu xây dựng",
  "CAT005": "Dịch vụ sửa chữa", "CAT006": "Thương mại điện tử",
};

const BUSINESSES = [
  {
    id: "biz-001",
    business_name: "Cửa hàng Minh Tâm",
    owner: { name: "Nguyễn Thị Lan", email: "lan.nguyen@gmail.com", tax_code: "8201234567" },
    province_code: "01",
    ward_code: "00085",
    address: "123 Phố Huế, Hai Bà Trưng",
    main_category_id: "CAT001",
    prefer_electronic_invoice: true,
    compliance_status: "compliant",
    created_at: "2024-03-15",
    updated_at: "2026-05-10",
    revenue_score: 87,
  },
  {
    id: "biz-002",
    business_name: "Quán Phở Hà Nội",
    owner: { name: "Trần Văn Hùng", email: "hung.tran@hotmail.com", tax_code: "8209876543" },
    province_code: "01",
    ward_code: "00091",
    address: "45 Đường Láng, Đống Đa",
    main_category_id: "CAT002",
    prefer_electronic_invoice: false,
    compliance_status: "at_risk",
    created_at: "2023-11-08",
    updated_at: "2026-04-22",
    revenue_score: 54,
  },
  {
    id: "biz-003",
    business_name: "Thời trang Bảo Châu",
    owner: { name: "Phạm Thị Bảo", email: "bao.pham@yahoo.com", tax_code: "8205551234" },
    province_code: "79",
    ward_code: "27211",
    address: "78 Nguyễn Huệ, Quận 1",
    main_category_id: "CAT003",
    prefer_electronic_invoice: true,
    compliance_status: "compliant",
    created_at: "2024-01-20",
    updated_at: "2026-05-18",
    revenue_score: 92,
  },
  {
    id: "biz-004",
    business_name: "Vật tư Xây dựng Đông Nam",
    owner: { name: "Lê Quang Minh", email: "minh.le@xaydung.vn", tax_code: "8203334455" },
    province_code: "48",
    ward_code: "20011",
    address: "234 Điện Biên Phủ, Thanh Khê",
    main_category_id: "CAT004",
    prefer_electronic_invoice: true,
    compliance_status: "non_compliant",
    created_at: "2023-07-03",
    updated_at: "2026-03-15",
    revenue_score: 31,
  },
  {
    id: "biz-005",
    business_name: "Sửa chữa Điện tử Hoàng",
    owner: { name: "Hoàng Đức Thắng", email: "thang.hoang@gmail.com", tax_code: "8207788990" },
    province_code: "31",
    ward_code: "10213",
    address: "56 Tôn Đức Thắng, Lê Chân",
    main_category_id: "CAT005",
    prefer_electronic_invoice: false,
    compliance_status: "pending",
    created_at: "2024-06-11",
    updated_at: "2026-05-01",
    revenue_score: 68,
  },
  {
    id: "biz-006",
    business_name: "Shop Online Hương Linh",
    owner: { name: "Vũ Thị Hương", email: "huong.vu@shopee.vn", tax_code: "8201122334" },
    province_code: "79",
    ward_code: "27193",
    address: "12 Lê Lợi, Quận 3",
    main_category_id: "CAT006",
    prefer_electronic_invoice: true,
    compliance_status: "compliant",
    created_at: "2024-09-05",
    updated_at: "2026-05-20",
    revenue_score: 95,
  },
  {
    id: "biz-007",
    business_name: "Bánh mì Sài Gòn Express",
    owner: { name: "Đặng Minh Tuấn", email: "tuan.dang@gmail.com", tax_code: "8204455667" },
    province_code: "79",
    ward_code: "27205",
    address: "90 Pasteur, Quận 1",
    main_category_id: "CAT002",
    prefer_electronic_invoice: true,
    compliance_status: "at_risk",
    created_at: "2023-04-22",
    updated_at: "2026-04-30",
    revenue_score: 49,
  },
];

const COMPLIANCE_CONFIG = {
  compliant: { label: "Compliant", color: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle2 },
  at_risk: { label: "At Risk", color: "text-amber-400", bg: "bg-amber-400/10", icon: AlertTriangle },
  non_compliant: { label: "Non-Compliant", color: "text-red-400", bg: "bg-red-400/10", icon: XCircle },
  pending: { label: "Pending Review", color: "text-blue-400", bg: "bg-blue-400/10", icon: Clock },
};

function ComplianceBadge({ status }: { status: keyof typeof COMPLIANCE_CONFIG }) {
  const cfg = COMPLIANCE_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function RevenueScore({ score }: { score: number }) {
  const color = score >= 80 ? "bg-emerald-400" : score >= 50 ? "bg-amber-400" : "bg-red-400";
  const textColor = score >= 80 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-medium ${textColor}`}>{score}</span>
    </div>
  );
}

export default function BusinessProfiles() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [selectedCompliance, setSelectedCompliance] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState("all");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filtered = BUSINESSES.filter(b => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      b.business_name.toLowerCase().includes(q) ||
      b.owner.name.toLowerCase().includes(q) ||
      b.owner.tax_code.includes(q) ||
      b.address.toLowerCase().includes(q);
    const matchesProvince = selectedProvince === "all" || b.province_code === selectedProvince;
    const matchesCompliance = selectedCompliance === "all" || b.compliance_status === selectedCompliance;
    const matchesInvoice = selectedInvoice === "all" ||
      (selectedInvoice === "electronic" && b.prefer_electronic_invoice) ||
      (selectedInvoice === "paper" && !b.prefer_electronic_invoice);
    return matchesSearch && matchesProvince && matchesCompliance && matchesInvoice;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3 h-3 text-primary" />
      : <ChevronDown className="w-3 h-3 text-primary" />;
  };

  const summaryStats = {
    total: BUSINESSES.length,
    compliant: BUSINESSES.filter(b => b.compliance_status === "compliant").length,
    atRisk: BUSINESSES.filter(b => b.compliance_status === "at_risk").length,
    electronic: BUSINESSES.filter(b => b.prefer_electronic_invoice).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Business Profiles</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage registered household business profiles, compliance status, and invoice preferences
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          Add Business
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Businesses", value: summaryStats.total, icon: Building2, color: "text-primary", bg: "bg-primary/10" },
          { label: "Compliant", value: summaryStats.compliant, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "At Risk", value: summaryStats.atRisk, icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-400/10" },
          { label: "E-Invoice Enabled", value: summaryStats.electronic, icon: Receipt, color: "text-blue-400", bg: "bg-blue-400/10" },
        ].map(card => (
          <div key={card.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className={`p-2.5 rounded-lg ${card.bg}`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div>
              <div className="text-2xl font-semibold text-foreground">{card.value}</div>
              <div className="text-xs text-muted-foreground">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-border flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search business name, owner, tax code..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={selectedProvince}
            onChange={e => { setSelectedProvince(e.target.value); setPage(1); }}
            className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Provinces</option>
            {Object.entries(PROVINCES).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>

          <select
            value={selectedCompliance}
            onChange={e => { setSelectedCompliance(e.target.value); setPage(1); }}
            className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Compliance</option>
            <option value="compliant">Compliant</option>
            <option value="at_risk">At Risk</option>
            <option value="non_compliant">Non-Compliant</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={selectedInvoice}
            onChange={e => { setSelectedInvoice(e.target.value); setPage(1); }}
            className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Invoice Types</option>
            <option value="electronic">Electronic Invoice</option>
            <option value="paper">Paper Invoice</option>
          </select>

          <div className="ml-auto text-xs text-muted-foreground">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {[
                  { label: "Business Name", field: "business_name" },
                  { label: "Owner", field: "owner" },
                  { label: "Province", field: "province_code" },
                  { label: "Address", field: null },
                  { label: "Category", field: "main_category_id" },
                  { label: "Compliance", field: "compliance_status" },
                  { label: "Revenue Score", field: "revenue_score" },
                  { label: "Created", field: "created_at" },
                  { label: "", field: null },
                ].map(col => (
                  <th
                    key={col.label}
                    className={`text-left px-4 py-3 text-xs font-medium text-muted-foreground ${col.field ? "cursor-pointer hover:text-foreground select-none" : ""}`}
                    onClick={() => col.field && handleSort(col.field)}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      {col.field && <SortIcon field={col.field} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((biz, i) => (
                <tr
                  key={biz.id}
                  className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${
                    i === paginated.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-foreground">{biz.business_name}</div>
                        <div className="text-[11px] text-muted-foreground">{biz.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-medium text-foreground">{biz.owner.name}</div>
                    <div className="text-[11px] text-muted-foreground">{biz.owner.tax_code}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-foreground">
                        {PROVINCES[biz.province_code as keyof typeof PROVINCES] || biz.province_code}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Ward: {biz.ward_code}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground truncate block max-w-[140px]">{biz.address}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground border border-border/50">
                      {CATEGORIES[biz.main_category_id as keyof typeof CATEGORIES] || biz.main_category_id}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ComplianceBadge status={biz.compliance_status as any} />
                  </td>
                  <td className="px-4 py-3">
                    <RevenueScore score={biz.revenue_score} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground">{biz.created_at}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                    p === page
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
