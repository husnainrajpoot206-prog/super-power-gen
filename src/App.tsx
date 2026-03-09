import { useState } from "react";
import { LayoutDashboard, Fuel, Settings, Plus, Play, Square, AlertTriangle, History, TrendingUp, Clock, Droplets, User, LogOut, X, Zap, ChevronRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ── Seed Data ──
const SEED_GENERATORS = [
  { id: 1, name: "Main Plant Gen-1", type: "Diesel", size: "500kVA", fuelRate: 42, tankCapacity: 2000 },
  { id: 2, name: "Block-B Gen-2", type: "Diesel", size: "200kVA", fuelRate: 18, tankCapacity: 800 },
  { id: 3, name: "Emergency Gen-3", type: "Gas", size: "100kVA", fuelRate: 9, tankCapacity: 400 },
];
const SEED_REFILLS = [
  { id: 1, generatorId: 1, generatorName: "Main Plant Gen-1", refillAmount: 500, date: new Date(Date.now() - 86400000 * 2).toISOString(), adminId: "Admin-1" },
  { id: 2, generatorId: 2, generatorName: "Block-B Gen-2", refillAmount: 200, date: new Date(Date.now() - 86400000).toISOString(), adminId: "Admin-1" },
];
const SEED_LOGS = [
  { id: 1, generatorId: 1, startTime: new Date(Date.now() - 86400000 * 3).toISOString(), stopTime: new Date(Date.now() - 86400000 * 3 + 14400000).toISOString(), runningHours: 4, fuelUsed: 168 },
  { id: 2, generatorId: 2, startTime: new Date(Date.now() - 86400000 * 3).toISOString(), stopTime: new Date(Date.now() - 86400000 * 3 + 7200000).toISOString(), runningHours: 2, fuelUsed: 36 },
  { id: 3, generatorId: 1, startTime: new Date(Date.now() - 86400000 * 2).toISOString(), stopTime: new Date(Date.now() - 86400000 * 2 + 21600000).toISOString(), runningHours: 6, fuelUsed: 252 },
  { id: 4, generatorId: 3, startTime: new Date(Date.now() - 86400000).toISOString(), stopTime: new Date(Date.now() - 86400000 + 18000000).toISOString(), runningHours: 5, fuelUsed: 45 },
  { id: 5, generatorId: 1, startTime: new Date(Date.now() - 86400000).toISOString(), stopTime: new Date(Date.now() - 86400000 + 28800000).toISOString(), runningHours: 8, fuelUsed: 336 },
  { id: 6, generatorId: 2, startTime: new Date(Date.now() - 3600000).toISOString(), stopTime: null, runningHours: null, fuelUsed: null },
];

let nextId = 100;

function getDailyData(logs: any[]) {
  const map: any = {};
  logs.filter(l => l.stopTime).forEach(l => {
    const d = l.startTime.slice(0, 10);
    if (!map[d]) map[d] = { date: d, fuelUsed: 0, hours: 0 };
    map[d].fuelUsed += l.fuelUsed || 0;
    map[d].hours += l.runningHours || 0;
  });
  return Object.values(map).sort((a: any, b: any) => a.date.localeCompare(b.date));
}

function calcFuel(gen: any, refills: any[], logs: any[]) {
  const totalRefills = refills.filter(r => r.generatorId === gen.id).reduce((s: number, r: any) => s + r.refillAmount, 0);
  const totalUsed = logs.filter(l => l.generatorId === gen.id && l.fuelUsed != null).reduce((s: number, l: any) => s + l.fuelUsed, 0);
  const current = Math.max(0, gen.tankCapacity + totalRefills - totalUsed);
  return { current, percentage: (current / gen.tankCapacity) * 100 };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function App() {
  const [role, setRole] = useState("ADMIN");
  const [tab, setTab] = useState("dashboard");
  const [generators, setGenerators] = useState(SEED_GENERATORS);
  const [logs, setLogs] = useState(SEED_LOGS);
  const [refills, setRefills] = useState(SEED_REFILLS);
  const [showAddGen, setShowAddGen] = useState(false);
  const [showRefill, setShowRefill] = useState(false);
  const [refillGenId, setRefillGenId] = useState<number | null>(null);
  const [refillAmt, setRefillAmt] = useState("");
  const [newGen, setNewGen] = useState({ name: "", type: "", size: "", fuelRate: "", tankCapacity: "" });

  const dailyData = getDailyData(logs);
  const totalHours = logs.filter(l => l.runningHours).reduce((s, l) => s + (l.runningHours || 0), 0);
  const totalFuelUsed = logs.filter(l => l.fuelUsed).reduce((s, l) => s + (l.fuelUsed || 0), 0);

  const enrichedGens = generators.map(g => {
    const activeLog = logs.find(l => l.generatorId === g.id && !l.stopTime);
    const { current, percentage } = calcFuel(g, refills, logs);
    return { ...g, activeLogId: activeLog?.id || null, current, percentage };
  });

  function startGen(genId: number) {
    setLogs(prev => [...prev, { id: nextId++, generatorId: genId, startTime: new Date().toISOString(), stopTime: null, runningHours: null, fuelUsed: null }]);
  }

  function stopGen(logId: number) {
    setLogs(prev => prev.map(l => {
      if (l.id !== logId) return l;
      const gen = generators.find(g => g.id === l.generatorId)!;
      const hours = (Date.now() - new Date(l.startTime).getTime()) / 3600000;
      return { ...l, stopTime: new Date().toISOString(), runningHours: hours, fuelUsed: hours * gen.fuelRate };
    }));
  }

  function addGenerator(e: any) {
    e.preventDefault();
    const g = { id: nextId++, name: newGen.name, type: newGen.type, size: newGen.size, fuelRate: parseFloat(newGen.fuelRate), tankCapacity: parseFloat(newGen.tankCapacity) };
    setGenerators(prev => [...prev, g]);
    setNewGen({ name: "", type: "", size: "", fuelRate: "", tankCapacity: "" });
    setShowAddGen(false);
  }

  function deleteGen(id: number) {
    if (!confirm("Delete this generator?")) return;
    setGenerators(prev => prev.filter(g => g.id !== id));
    setLogs(prev => prev.filter(l => l.generatorId !== id));
    setRefills(prev => prev.filter(r => r.generatorId !== id));
  }

  function doRefill() {
    if (!refillGenId || !refillAmt) return;
    const gen = generators.find(g => g.id === refillGenId)!;
    setRefills(prev => [...prev, { id: nextId++, generatorId: refillGenId, generatorName: gen.name, refillAmount: parseFloat(refillAmt), date: new Date().toISOString(), adminId: "Admin-1" }]);
    setShowRefill(false); setRefillAmt(""); setRefillGenId(null);
  }

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, always: true },
    { id: "reports", label: "Reports", icon: History, admin: true },
    { id: "settings", label: "Management", icon: Settings, admin: true },
  ];

  const S: any = {
    app: { display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans',system-ui,sans-serif", color: "#0f172a" },
    aside: { width: 240, background: "#fff", borderRight: "1px solid #f1f5f9", display: "flex", flexDirection: "column", flexShrink: 0 },
    logo: { padding: "1.5rem", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 },
    logoBadge: { background: "linear-gradient(135deg,#10b981,#059669)", borderRadius: 10, padding: "0.5rem", display: "flex" },
    logoText: { fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em" },
    nav: { flex: 1, padding: "1rem", display: "flex", flexDirection: "column", gap: 4 },
    main: { flex: 1, overflowY: "auto", padding: "2rem" },
    card: { background: "#fff", borderRadius: 16, padding: "1.5rem", border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,.05)" },
    grid4: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "1.25rem" },
    overlay: { position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: "1rem" },
    modal: { background: "#fff", borderRadius: 24, padding: "2rem", width: "100%", maxWidth: 440, boxShadow: "0 25px 50px rgba(0,0,0,.18)" },
  };

  return (
    <div style={S.app}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0}input{font-family:inherit}`}</style>

      {/* Sidebar */}
      <aside style={S.aside}>
        <div style={S.logo}>
          <div style={S.logoBadge}><Zap size={20} color="#fff" /></div>
          <span style={S.logoText}>Super Power Gen</span>
        </div>
        <nav style={S.nav}>
          {nav.filter(n => n.always || (n.admin && role === "ADMIN")).map(n => {
            const active = tab === n.id;
            return (
              <button key={n.id} onClick={() => setTab(n.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.65rem 0.9rem", borderRadius: 10, border: "none", background: active ? "#ecfdf5" : "transparent", color: active ? "#059669" : "#64748b", fontWeight: active ? 700 : 500, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                <n.icon size={18} />{n.label}
                {active && <ChevronRight size={14} style={{ marginLeft: "auto" }} />}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: "1rem", borderTop: "1px solid #f1f5f9" }}>
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: "0.75rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ background: "#fff", borderRadius: "50%", padding: "0.35rem", border: "1px solid #e2e8f0", display: "flex" }}><User size={14} color="#64748b" /></div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{role}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Active Session</div>
              </div>
            </div>
            <button onClick={() => setRole(r => r === "ADMIN" ? "TEAM" : "ADMIN")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }} title="Switch Role">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={S.main}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>
              {tab === "dashboard" ? "System Overview" : tab === "reports" ? "Performance Reports" : "Generator Management"}
            </h2>
            <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 3 }}>Welcome back, {role === "ADMIN" ? "Administrator" : "Team Member"}</p>
          </div>
          {role === "ADMIN" && tab === "settings" && (
            <button onClick={() => setShowAddGen(true)} style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 10, padding: "0.65rem 1.25rem", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
              <Plus size={16} />Add Generator
            </button>
          )}
        </div>

        {/* Dashboard */}
        {tab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div style={S.grid4}>
              {[
                { title: "Total Fuel Used", value: `${totalFuelUsed.toFixed(1)} L`, icon: Droplets, color: "#3b82f6", sub: "All time" },
                { title: "Running Hours", value: `${totalHours.toFixed(1)} h`, icon: Clock, color: "#f59e0b", sub: "Cumulative" },
                { title: "Active Units", value: enrichedGens.filter(g => g.activeLogId).length, icon: Play, color: "#10b981", sub: "Running now" },
                { title: "Low Fuel Alerts", value: enrichedGens.filter(g => g.percentage < 10).length, icon: AlertTriangle, color: "#ef4444", sub: "Critical" },
              ].map(s => (
                <div key={s.title} style={S.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <div style={{ background: s.color, borderRadius: 12, padding: "0.6rem", display: "flex" }}><s.icon size={22} color="#fff" /></div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{s.title}</span>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#1e293b" }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
              <div style={S.card}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.25rem" }}>
                  <TrendingUp size={18} color="#10b981" />
                  <span style={{ fontWeight: 700, fontSize: 15 }}>Fuel Consumption Trend</span>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={dailyData as any}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 10px 30px rgba(0,0,0,.1)", fontSize: 13 }} />
                    <Area type="monotone" dataKey="fuelUsed" stroke="#10b981" strokeWidth={2.5} fill="url(#g1)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div style={{ ...S.card, overflowY: "auto", maxHeight: 380 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: "1rem" }}>Generator Status</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {enrichedGens.map(gen => {
                    const isLow = gen.percentage < 10;
                    const barColor = isLow ? "#ef4444" : gen.percentage < 30 ? "#f59e0b" : "#10b981";
                    return (
                      <div key={gen.id} style={{ background: "#f8fafc", borderRadius: 12, padding: "0.9rem", border: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{gen.name}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>{gen.type} • {gen.size}</div>
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 7px", borderRadius: 6, background: gen.activeLogId ? "#d1fae5" : "#f1f5f9", color: gen.activeLogId ? "#059669" : "#94a3b8", textTransform: "uppercase" as const }}>
                            {gen.activeLogId ? "Running" : "Standby"}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                          <span style={{ color: "#94a3b8" }}>Fuel Level</span>
                          <span style={{ fontWeight: 700, color: isLow ? "#ef4444" : "#1e293b" }}>{gen.current.toFixed(0)}L ({gen.percentage.toFixed(0)}%)</span>
                        </div>
                        <div style={{ background: "#e2e8f0", borderRadius: 99, height: 7, overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(100, Math.max(0, gen.percentage))}%`, height: "100%", background: barColor, borderRadius: 99, transition: "width 0.6s ease" }} />
                        </div>
                        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                          {gen.activeLogId ? (
                            <button onClick={() => stopGen(gen.activeLogId!)} style={{ flex: 1, background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, padding: "0.4rem", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontFamily: "inherit" }}>
                              <Square size={12} />Stop
                            </button>
                          ) : (
                            <button onClick={() => startGen(gen.id)} style={{ flex: 1, background: "#10b981", color: "#fff", border: "none", borderRadius: 8, padding: "0.4rem", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontFamily: "inherit" }}>
                              <Play size={12} />Start
                            </button>
                          )}
                          {role === "ADMIN" && (
                            <button onClick={() => { setRefillGenId(gen.id); setShowRefill(true); }} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "0.4rem 0.6rem", cursor: "pointer", display: "flex", alignItems: "center" }}>
                              <Fuel size={13} color="#64748b" />
                            </button>
                          )}
                        </div>
                        {isLow && <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, fontSize: 10, fontWeight: 700, color: "#ef4444", textTransform: "uppercase" as const }}><AlertTriangle size={10} />Critical Fuel Level</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports */}
        {tab === "reports" && role === "ADMIN" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ background: "linear-gradient(135deg,#064e3b,#065f46)", borderRadius: 20, padding: "2rem", color: "#fff", position: "relative" as const, overflow: "hidden" }}>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Daily Consumption Log</div>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginBottom: 0 }}>Track your generator fuel usage day by day.</p>
            </div>
            <div style={{ ...S.card, overflow: "hidden", padding: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Date", "Running Hours", "Fuel Used", "Efficiency (L/h)"].map(h => (
                      <th key={h} style={{ padding: "0.75rem 1.25rem", textAlign: "left" as const, fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(dailyData as any[]).slice().reverse().map((row: any, i: number) => (
                    <tr key={i} style={{ borderTop: "1px solid #f8fafc" }}>
                      <td style={{ padding: "0.85rem 1.25rem", fontSize: 13, fontWeight: 600, color: "#334155" }}>{fmtDate(row.date)}</td>
                      <td style={{ padding: "0.85rem 1.25rem", fontSize: 13, color: "#64748b" }}>{row.hours.toFixed(2)} h</td>
                      <td style={{ padding: "0.85rem 1.25rem", fontSize: 13, color: "#64748b", fontWeight: 700 }}>{row.fuelUsed.toFixed(2)} L</td>
                      <td style={{ padding: "0.85rem 1.25rem", fontSize: 13, color: "#64748b" }}>{(row.fuelUsed / (row.hours || 1)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f1f5f9", fontWeight: 700, fontSize: 15 }}>Refill History</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Date", "Generator", "Amount", "Admin"].map(h => (
                      <th key={h} style={{ padding: "0.75rem 1.25rem", textAlign: "left" as const, fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...refills].reverse().map((r: any, i: number) => (
                    <tr key={i} style={{ borderTop: "1px solid #f8fafc" }}>
                      <td style={{ padding: "0.85rem 1.25rem", fontSize: 13, color: "#334155" }}>{fmtDateTime(r.date)}</td>
                      <td style={{ padding: "0.85rem 1.25rem", fontSize: 13, color: "#64748b" }}>{r.generatorName}</td>
                      <td style={{ padding: "0.85rem 1.25rem", fontSize: 13, color: "#059669", fontWeight: 700 }}>+{r.refillAmount.toFixed(1)} L</td>
                      <td style={{ padding: "0.85rem 1.25rem", fontSize: 13, color: "#94a3b8" }}>{r.adminId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings */}
        {tab === "settings" && role === "ADMIN" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {enrichedGens.map(gen => (
              <div key={gen.id} style={{ ...S.card, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                  <div style={{ background: "#f8fafc", borderRadius: 12, padding: "1rem", border: "1px solid #f1f5f9" }}><Settings size={28} color="#94a3b8" /></div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{gen.name}</div>
                    <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                      {[["Type", gen.type], ["Size", gen.size], ["Rate", `${gen.fuelRate} L/h`], ["Capacity", `${gen.tankCapacity} L`]].map(([k, v]) => (
                        <span key={k} style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" as const }}>{k}: <span style={{ color: "#64748b" }}>{v}</span></span>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setRefillGenId(gen.id); setShowRefill(true); }} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "0.5rem 1rem", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", color: "#64748b" }}>Refill</button>
                  <button onClick={() => deleteGen(gen.id)} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 10, padding: "0.5rem 1rem", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Generator Modal */}
      {showAddGen && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>New Generator</div>
              <button onClick={() => setShowAddGen(false)} style={{ background: "#f8fafc", border: "none", borderRadius: 8, padding: "0.4rem", cursor: "pointer", display: "flex" }}><X size={18} color="#64748b" /></button>
            </div>
            <form onSubmit={addGenerator} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
              {[["Name", "name", "text", "Main Plant Gen-1"], ["Type", "type", "text", "Diesel"], ["Size", "size", "text", "500kVA"]].map(([label, key, type, ph]) => (
                <div key={key}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, marginBottom: 5 }}>{label}</div>
                  <input type={type} placeholder={ph} value={(newGen as any)[key]} onChange={e => setNewGen({ ...newGen, [key]: e.target.value })} required={key === "name"} style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: 10, border: "1.5px solid #e2e8f0", outline: "none", fontSize: 14 }} />
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                {[["Fuel Rate (L/h)", "fuelRate"], ["Capacity (L)", "tankCapacity"]].map(([label, key]) => (
                  <div key={key}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, marginBottom: 5 }}>{label}</div>
                    <input type="number" value={(newGen as any)[key]} onChange={e => setNewGen({ ...newGen, [key]: e.target.value })} required style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: 10, border: "1.5px solid #e2e8f0", outline: "none", fontSize: 14 }} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setShowAddGen(false)} style={{ flex: 1, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "0.7rem", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", color: "#64748b" }}>Cancel</button>
                <button type="submit" style={{ flex: 1, background: "#10b981", color: "#fff", border: "none", borderRadius: 10, padding: "0.7rem", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refill Modal */}
      {showRefill && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>Fuel Refill</div>
              <button onClick={() => { setShowRefill(false); setRefillAmt(""); setRefillGenId(null); }} style={{ background: "#f8fafc", border: "none", borderRadius: 8, padding: "0.4rem", cursor: "pointer", display: "flex" }}><X size={18} color="#64748b" /></button>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, marginBottom: 5 }}>Amount (Liters)</div>
            <input type="number" placeholder="0.00" value={refillAmt} onChange={e => setRefillAmt(e.target.value)} style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: 10, border: "1.5px solid #e2e8f0", outline: "none", fontSize: 18, fontWeight: 700 }} />
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              <button onClick={() => { setShowRefill(false); setRefillAmt(""); setRefillGenId(null); }} style={{ flex: 1, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "0.7rem", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", color: "#64748b" }}>Cancel</button>
              <button onClick={doRefill} style={{ flex: 1, background: "#10b981", color: "#fff", border: "none", borderRadius: 10, padding: "0.7rem", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Confirm Refill</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}