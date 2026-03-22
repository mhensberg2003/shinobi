"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const body = mode === "login"
        ? { username, password }
        : { username, password, inviteCode };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.replace(next);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `${mode === "login" ? "Login" : "Sign up"} failed.`);
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 40 }}>
          <Image src="/logo.png" alt="Shinobi" width={48} height={48} className="object-contain" />
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            style={inputStyle}
          />
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              required
              style={inputStyle}
            />
          )}

          {error && (
            <p style={{ fontSize: 13, color: "var(--accent)", margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              height: 44,
              background: loading ? "rgba(229,9,20,0.5)" : "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "opacity 0.15s",
            }}
          >
            {loading ? (mode === "login" ? "Signing in…" : "Creating account…") : (mode === "login" ? "Sign in" : "Create account")}
          </button>

          <button
            type="button"
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
            style={{
              background: "none",
              border: "none",
              color: "var(--muted)",
              fontSize: 13,
              cursor: "pointer",
              textAlign: "center",
              padding: "4px 0",
            }}
          >
            {mode === "login" ? "Have an invite code? Create account" : "Already have an account? Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

const inputStyle: React.CSSProperties = {
  height: 44,
  padding: "0 14px",
  background: "#1e1e1e",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  color: "var(--fg)",
  fontSize: 14,
  outline: "none",
  width: "100%",
};
