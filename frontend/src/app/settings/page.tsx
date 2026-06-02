"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    api
      .getGoogleStatus()
      .then((res) => setConnected(res.connected))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load status"))
      .finally(() => setLoading(false));
  }, []);

  async function handleConnect() {
    setWorking(true);
    setError("");
    try {
      const res = await api.connectGoogle();
      window.location.href = res.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect Google");
      setWorking(false);
    }
  }

  async function handleDisconnect() {
    setWorking(true);
    setError("");
    try {
      await api.disconnectGoogle();
      setConnected(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect Google");
    } finally {
      setWorking(false);
    }
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <header>
          <h1 className="text-2xl font-semibold text-zinc-50">Settings</h1>
        </header>

        {error && (
          <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
        )}

        <section className="mt-8 max-w-xl rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-lg">
          <h2 className="text-lg font-medium text-zinc-100">Google Business Profile</h2>
          {loading ? (
            <p className="mt-3 text-sm text-zinc-500">Loading…</p>
          ) : (
            <p className="mt-3 text-sm text-zinc-300">
              {connected ? "Connected" : "Not Connected"}
            </p>
          )}
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={handleConnect}
              disabled={loading || working}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              Connect Google
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={loading || working}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
            >
              Disconnect
            </button>
          </div>
        </section>
      </DashboardLayout>
    </AuthGuard>
  );
}
