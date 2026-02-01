"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [supabase, setSupabase] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSupabase(createClient());
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let isMounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      if (error) {
        setStatus("Nao foi possivel verificar sua sessao.");
        return;
      }
      if (data?.session) {
        window.location.href = "/welcome";
      }
    });

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const handleGoogleLogin = async () => {
    if (!supabase) return;
    setLoading(true);
    setStatus("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/welcome`,
      },
    });

    if (error) {
      setStatus("Falha ao iniciar o login. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <main className="app-shell">
      <section className="card">
        <p className="eyebrow">PropSuite</p>
        <h1 className="title">Entre para gerenciar suas contas</h1>
        <p className="subtitle">
          Acesse com Google para acompanhar suas mesas proprietarias em um
          painel simples e rapido.
        </p>
        <div className="actions">
          <button className="button" onClick={handleGoogleLogin} disabled={loading}>
            {!loading && (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="20"
                height="20"
              >
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.82-.07-1.42-.22-2.05H12.24v3.75h6.45c-.13 1-.83 2.51-2.38 3.52l-.02.12 3.49 2.7.24.02c2.2-2.03 3.47-5.02 3.47-8.06z"
                />
                <path
                  fill="#34A853"
                  d="M12.24 23.5c3.16 0 5.81-1.04 7.75-2.83l-3.7-2.86c-.99.69-2.32 1.17-4.05 1.17-3.1 0-5.72-2.03-6.66-4.83l-.11.01-3.6 2.78-.04.1c1.92 3.82 5.88 6.46 10.41 6.46z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.58 14.15a6.74 6.74 0 0 1-.35-2.15c0-.75.13-1.47.34-2.15l-.01-.14-3.63-2.82-.12.06A11.76 11.76 0 0 0 0 12c0 1.92.47 3.73 1.3 5.34l4.28-3.19z"
                />
                <path
                  fill="#EA4335"
                  d="M12.24 4.98c2.25 0 3.77.97 4.64 1.78l3.39-3.31C18.04 1.33 15.4.5 12.24.5 7.71.5 3.75 3.14 1.83 6.95l3.75 2.9c.94-2.8 3.56-4.87 6.66-4.87z"
                />
              </svg>
            )}
            {loading ? "Abrindo o Google..." : "Entrar com Google"}
          </button>
        </div>
        {status ? <p className="status">{status}</p> : null}
        <p className="note">
          Depois do login voce sera direcionado para a tela de boas-vindas.
        </p>
      </section>
    </main>
  );
}
