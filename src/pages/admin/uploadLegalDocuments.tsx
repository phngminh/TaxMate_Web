import { useState, useRef } from "react";
import {
  Upload, FileText, CheckCircle2, AlertCircle, Clock, Cpu,
  Search, Filter, ChevronDown, MoreHorizontal, Layers,
  Tag, TrendingUp, Zap, Database, RefreshCw, Eye, Trash2,
  FileSearch, Activity, BarChart3, ArrowUpRight, X
} from "lucide-react";

const RECENT_UPLOADS = [
  {
    id: "doc-001",
    name: "Thông tư 78/2021/TT-BTC",
    category: "Thuế thu nhập doanh nghiệp",
    size: "2.4 MB",
    uploadedAt: "2026-05-22 09:14",
    status: "indexed",
    chunks: 312,
    embeddingScore: 96.2,
    version: "v1.0"
  },
  {
    id: "doc-002",
    name: "Nghị định 123/2020/NĐ-CP",
    category: "Hóa đơn điện tử",
    size: "5.1 MB",
    uploadedAt: "2026-05-21 16:42",
    status: "indexed",
    chunks: 548,
    embeddingScore: 94.7,
    version: "v2.1"
  },
  {
    id: "doc-003",
    name: "Luật Thuế GTGT sửa đổi 2024",
    category: "Thuế GTGT",
    size: "1.8 MB",
    uploadedAt: "2026-05-21 11:05",
    status: "indexing",
    chunks: 201,
    embeddingScore: null,
    version: "v1.0"
  },
  {
    id: "doc-004",
    name: "Thông tư 40/2021/TT-BTC",
    category: "Hộ kinh doanh",
    size: "3.3 MB",
    uploadedAt: "2026-05-20 14:30",
    status: "failed",
    chunks: 0,
    embeddingScore: null,
    version: "v1.0"
  },
  {
    id: "doc-005",
    name: "Quyết định 206/QĐ-BTC",
    category: "Quy trình nội bộ",
    size: "0.9 MB",
    uploadedAt: "2026-05-20 09:18",
    status: "indexed",
    chunks: 87,
    embeddingScore: 91.3,
    version: "v3.0"
  },
  {
    id: "doc-006",
    name: "Nghị định 70/2025/NĐ-CP",
    category: "Quản lý thuế",
    size: "4.2 MB",
    uploadedAt: "2026-05-19 17:55",
    status: "indexed",
    chunks: 423,
    embeddingScore: 97.1,
    version: "v1.0"
  },
];

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "parsing" | "indexing" | "done" | "error";
  category: string;
  tags: string[];
}

const CATEGORIES = [
  "Thuế thu nhập doanh nghiệp",
  "Thuế GTGT",
  "Hóa đơn điện tử",
  "Hộ kinh doanh",
  "Quản lý thuế",
  "Quy trình nội bộ",
  "Khác",
];

const STATUS_CONFIG = {
  indexed: { label: "Indexed", color: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle2 },
  indexing: { label: "Indexing...", color: "text-amber-400", bg: "bg-amber-400/10", icon: Clock },
  failed: { label: "Failed", color: "text-red-400", bg: "bg-red-400/10", icon: AlertCircle },
  uploading: { label: "Uploading", color: "text-blue-400", bg: "bg-blue-400/10", icon: Upload },
  parsing: { label: "Parsing", color: "text-purple-400", bg: "bg-purple-400/10", icon: Cpu },
  done: { label: "Done", color: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle2 },
  error: { label: "Error", color: "text-red-400", bg: "bg-red-400/10", icon: AlertCircle },
};

function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function MetricCard({ label, value, sub, icon: Icon, trend }: {
  label: string; value: string | number; sub?: string;
  icon: any; trend?: { value: string; up: boolean };
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-xs font-medium ${trend.up ? "text-emerald-400" : "text-red-400"}`}>
            <ArrowUpRight className={`w-3 h-3 ${!trend.up ? "rotate-90" : ""}`} />
            {trend.value}
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      {sub && <div className="text-xs text-primary mt-1">{sub}</div>}
    </div>
  );
}

export default function UploadLegalDocuments() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f =>
      [".pdf", ".docx", ".doc"].some(ext => f.name.toLowerCase().endsWith(ext))
    );
    addFiles(files);
  };

  const addFiles = (files: File[]) => {
    const newUploads: UploadFile[] = files.map(f => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      progress: 0,
      status: "uploading",
      category: "Khác",
      tags: [],
    }));
    setUploadFiles(prev => [...prev, ...newUploads]);

    newUploads.forEach(upload => {
      simulateUpload(upload.id);
    });
  };

  const simulateUpload = (id: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploadFiles(prev => prev.map(f =>
          f.id === id ? { ...f, progress: 100, status: "parsing" } : f
        ));
        setTimeout(() => {
          setUploadFiles(prev => prev.map(f =>
            f.id === id ? { ...f, status: "indexing" } : f
          ));
          setTimeout(() => {
            setUploadFiles(prev => prev.map(f =>
              f.id === id ? { ...f, status: "done" } : f
            ));
          }, 2500);
        }, 1500);
      } else {
        setUploadFiles(prev => prev.map(f =>
          f.id === id ? { ...f, progress } : f
        ));
      }
    }, 200);
  };

  const filteredDocs = RECENT_UPLOADS.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || doc.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const indexedCount = RECENT_UPLOADS.filter(d => d.status === "indexed").length;
  const failedCount = RECENT_UPLOADS.filter(d => d.status === "failed").length;
  const totalChunks = RECENT_UPLOADS.filter(d => d.status === "indexed").reduce((a, d) => a + d.chunks, 0);
  const avgScore = RECENT_UPLOADS.filter(d => d.embeddingScore).reduce((a, d, _, arr) =>
    a + (d.embeddingScore! / arr.length), 0);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Upload Legal Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered document ingestion, parsing, and vector indexing for the RAG knowledge base
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <RefreshCw className="w-4 h-4" />
          Sync Index
        </button>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Total Indexed Documents"
          value={indexedCount}
          sub={`${RECENT_UPLOADS.length} total uploaded`}
          icon={Database}
          trend={{ value: "+3 today", up: true }}
        />
        <MetricCard
          label="Failed Indexing"
          value={failedCount}
          sub="Requires attention"
          icon={AlertCircle}
          trend={{ value: "1 pending fix", up: false }}
        />
        <MetricCard
          label="Total Chunks Processed"
          value={totalChunks.toLocaleString()}
          sub="Vector embeddings stored"
          icon={Layers}
          trend={{ value: "+548 this week", up: true }}
        />
        <MetricCard
          label="Avg. Retrieval Accuracy"
          value={`${avgScore.toFixed(1)}%`}
          sub="Embedding quality score"
          icon={TrendingUp}
          trend={{ value: "+1.2% vs last week", up: true }}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Upload zone + active uploads */}
        <div className="col-span-1 space-y-4">
          {/* Drag & drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/50 hover:bg-primary/5"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => addFiles(Array.from(e.target.files || []))}
            />
            <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? "bg-primary/20" : "bg-muted"}`}>
              <Upload className={`w-8 h-8 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <p className="text-sm font-medium text-foreground text-center">
              Drop legal documents here
            </p>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              PDF, DOCX, DOC — up to 50MB each
            </p>
            <div className="mt-4 px-4 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium">
              Browse Files
            </div>
          </div>

          {/* Metadata config panel */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              Metadata Configuration
            </h3>
            <div className="space-y-2">
              <label className="block text-xs text-muted-foreground">Document Category</label>
              <select className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs text-muted-foreground">Tags</label>
              <input
                type="text"
                placeholder="e.g. thuế, 2024, hóa đơn"
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs text-muted-foreground">Effective Date</label>
              <input
                type="date"
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">Auto-extract metadata</span>
              <div className="w-9 h-5 bg-primary rounded-full relative cursor-pointer">
                <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow" />
              </div>
            </div>
          </div>

          {/* Embedding status panel */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Embedding Pipeline Status
            </h3>
            {[
              { label: "Text Extraction", pct: 100, color: "bg-emerald-400" },
              { label: "Chunk Splitting", pct: 100, color: "bg-emerald-400" },
              { label: "Vector Embedding", pct: 87, color: "bg-primary" },
              { label: "Index Storage", pct: 72, color: "bg-amber-400" },
            ].map(step => (
              <div key={step.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{step.label}</span>
                  <span className="text-foreground font-medium">{step.pct}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${step.color}`} style={{ width: `${step.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active upload queue + document table */}
        <div className="col-span-2 space-y-4">
          {/* Active uploads */}
          {uploadFiles.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Active Uploads ({uploadFiles.length})
                </h3>
                <button
                  onClick={() => setUploadFiles([])}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear all
                </button>
              </div>
              <div className="space-y-3">
                {uploadFiles.map(uf => (
                  <div key={uf.id} className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm text-foreground truncate max-w-[240px]">{uf.file.name}</span>
                      </div>
                      <StatusBadge status={uf.status} />
                    </div>
                    {uf.status === "uploading" && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Uploading...</span>
                          <span>{Math.round(uf.progress)}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-400 rounded-full transition-all duration-200"
                            style={{ width: `${uf.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {uf.status === "parsing" && (
                      <div className="flex items-center gap-2 text-xs text-purple-400">
                        <Cpu className="w-3 h-3 animate-pulse" />
                        AI parsing document structure...
                      </div>
                    )}
                    {uf.status === "indexing" && (
                      <div className="flex items-center gap-2 text-xs text-amber-400">
                        <Database className="w-3 h-3 animate-pulse" />
                        Generating vector embeddings...
                      </div>
                    )}
                    {uf.status === "done" && (
                      <div className="flex items-center gap-2 text-xs text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        Successfully indexed and ready for retrieval
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Retrieval quality analytics */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Retrieval Quality Analytics
              </h3>
              <span className="text-xs text-muted-foreground">Last 7 days</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Avg. Precision@5", value: "94.2%", delta: "+1.1%", up: true },
                { label: "Avg. Recall@10", value: "87.6%", delta: "+0.4%", up: true },
                { label: "Mean Reciprocal Rank", value: "0.912", delta: "-0.003", up: false },
              ].map(m => (
                <div key={m.label} className="bg-muted/40 rounded-lg p-3">
                  <div className="text-lg font-semibold text-foreground">{m.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{m.label}</div>
                  <div className={`text-xs mt-1 font-medium ${m.up ? "text-emerald-400" : "text-red-400"}`}>{m.delta}</div>
                </div>
              ))}
            </div>
            {/* Simple bar chart mockup */}
            <div className="mt-4 flex items-end gap-1.5 h-24">
              {[62, 71, 68, 85, 79, 91, 94].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-sm bg-primary/60 hover:bg-primary transition-colors cursor-pointer"
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {["M", "T", "W", "T", "F", "S", "S"][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Document table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-primary" />
                Legal Document Index
              </h3>
              <div className="flex items-center gap-2 flex-1 max-w-xs">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-muted border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="bg-muted border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">All Status</option>
                  <option value="indexed">Indexed</option>
                  <option value="indexing">Indexing</option>
                  <option value="failed">Failed</option>
                </select>
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Filter className="w-3.5 h-3.5" />
                  Filter
                </button>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Document</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Chunks</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Uploaded</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">Ver.</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc, i) => (
                  <tr
                    key={doc.id}
                    className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${
                      i === filteredDocs.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                        <div>
                          <div className="text-xs font-medium text-foreground truncate max-w-[160px]">{doc.name}</div>
                          <div className="text-[11px] text-muted-foreground">{doc.size}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">{doc.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={doc.status as any} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs text-foreground">{doc.chunks > 0 ? doc.chunks.toLocaleString() : "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {doc.embeddingScore ? (
                        <span className={`text-xs font-medium ${
                          doc.embeddingScore >= 95 ? "text-emerald-400" :
                          doc.embeddingScore >= 90 ? "text-amber-400" : "text-red-400"
                        }`}>{doc.embeddingScore}%</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">{doc.uploadedAt}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">{doc.version}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
