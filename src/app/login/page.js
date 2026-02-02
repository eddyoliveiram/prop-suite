"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-background via-background/95 to-muted/40 px-6 py-10">
      <div className="pointer-events-none absolute -top-32 right-[-10%] h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-20%] left-[-10%] h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl" />
      <Card className="relative w-full max-w-xl border-muted/60 bg-background/90 shadow-xl">
        <CardHeader className="space-y-4 pb-4 text-center">
          <div className="flex justify-center">
            <span className="text-5xl text-foreground [font-family:var(--font-story-script)]">
              PropSuite
            </span>
          </div>
          <CardTitle className="text-2xl">Entre para continuar</CardTitle>
          <CardDescription>
            Use sua conta Google para acessar a ferramenta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="h-12 w-full gap-2 text-base" onClick={handleGoogleLogin} disabled={loading}>
            {!loading && (
              <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
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
          </Button>
          {status ? <p className="text-sm text-destructive">{status}</p> : null}
        </CardContent>
      </Card>
    </main>
  );
}
