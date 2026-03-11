import { useState } from "react";
import { supabase } from "./supabase";
import { Zap } from "lucide-react";

export default function Auth() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleLogin() {
        setLoading(true);
        setError("");
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(error.message);
        setLoading(false);
    }

    return (
        <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',system-ui,sans-serif" }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>
            <div style={{ background: "#fff", borderRadius: 24, padding: "2.5rem", width: "100%", maxWidth: 400, boxShadow: "0 25px 50px rgba(0,0,0,.1)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "2rem" }}>
                    <div style={{ background: "linear-gradient(135deg,#10b981,#059669)", borderRadius: 10, padding: "0.5rem", display: "flex" }}><Zap size={20} color="#fff" /></div>
                    <span style={{ fontWeight: 800, fontSize: 18 }}>Super Power Gen</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Sign In</div>
                <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: "1.5rem" }}>Enter your credentials to continue</p>

                {error && <div style={{ background: "#fef2f2", color: "#ef4444", padding: "0.75rem 1rem", borderRadius: 10, fontSize: 13, marginBottom: "1rem", fontWeight: 600 }}>{error}</div>}

                <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, marginBottom: 5 }}>Email</div>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: 10, border: "1.5px solid #e2e8f0", outline: "none", fontSize: 14, fontFamily: "inherit" }} />
                </div>
                <div style={{ marginBottom: "1.5rem" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, marginBottom: 5 }}>Password</div>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: 10, border: "1.5px solid #e2e8f0", outline: "none", fontSize: 14, fontFamily: "inherit" }} />
                </div>
                <button onClick={handleLogin} disabled={loading} style={{ width: "100%", background: "#10b981", color: "#fff", border: "none", borderRadius: 10, padding: "0.85rem", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>
                    {loading ? "Signing in..." : "Sign In"}
                </button>
            </div>
        </div>
    );
}