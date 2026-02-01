"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export default function WelcomePage() {
  const [supabase, setSupabase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSupabase(createClient());
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let isMounted = true;

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) return;
      if (error) {
        setMessage("Nao foi possivel carregar sua sessao.");
        setLoading(false);
        return;
      }
      const currentUser = data?.session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, is_admin, is_approved")
          .eq("id", currentUser.id)
          .single();
        if (profileError) {
          setMessage("Nao foi possivel carregar seu perfil.");
        } else {
          setProfile(profileData);
          if (profileData?.is_admin || profileData?.is_approved) {
            window.location.href = "/dashboard";
            return;
          }
        }
      }
      setLoading(false);
    };

    loadSession();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      isMounted = false;
      subscription?.subscription?.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <main className="app-shell">
        <section className="card">
          <p className="loading">Carregando sua sessao...</p>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="app-shell">
        <section className="card">
          <p className="eyebrow">PropSuite</p>
          <h1 className="title">Voce ainda nao entrou</h1>
          <p className="subtitle">Faca login para acessar seu painel.</p>
          <div className="actions">
            <a className="button" href="/login">
              Ir para login
            </a>
          </div>
        </section>
      </main>
    );
  }

  const displayName =
    profile?.full_name || user.user_metadata?.full_name || "Trader";
  const avatarUrl =
    profile?.avatar_url ||
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    "https://www.gravatar.com/avatar/?d=mp";

  return (
    <main className="app-shell">
      <section className="card">
        <p className="eyebrow">PropSuite</p>
        <div className="alert">
          <div className="alert-title">
            <span className="alert-icon" aria-hidden="true">!</span>
            <span>Acesso pendente</span>
          </div>
          <p className="alert-text">
            Sua conta ainda não foi liberada.
            <br />
            Para concluir a ativação, realize o pagamento, informe seu e-mail
            do Gmail cadastrado e envie o comprovante ao administrador.
          </p>
        </div>
        <div className="user-pill">
          <img
            className="avatar"
            src={avatarUrl}
            alt="Foto do usuario"
            referrerPolicy="no-referrer"
          />
          <div className="user-meta">
            <strong>{displayName}</strong>
            <span>{user.email}</span>
          </div>
        </div>
        {message ? <p className="status">{message}</p> : null}
        <div className="actions">
          <button className="button secondary" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </section>
    </main>
  );
}
