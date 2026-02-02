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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

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

    const ensureProfile = async (currentUser) => {
      if (!currentUser) return { data: null, error: null };
      const metadata = currentUser.user_metadata || {};
      const payload = {
        id: currentUser.id,
        email: currentUser.email || null,
        full_name: metadata.full_name || metadata.name || null,
        avatar_url: metadata.avatar_url || metadata.picture || null,
      };
      const { error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" });
      if (error) return { data: null, error };
      return supabase
        .from("profiles")
        .select("full_name, avatar_url, is_admin, is_approved")
        .eq("id", currentUser.id)
        .maybeSingle();
    };

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
        let { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, is_admin, is_approved")
          .eq("id", currentUser.id)
          .maybeSingle();
        if (profileError || !profileData) {
          const ensured = await ensureProfile(currentUser);
          profileData = ensured?.data || null;
          profileError = ensured?.error || null;
        }
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
      <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Carregando...
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Voce ainda nao entrou</CardTitle>
            <CardDescription>Faca login para acessar seu painel.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => (window.location.href = "/login")}>
              Ir para login
            </Button>
          </CardContent>
        </Card>
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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-background/95 to-muted/40 px-6 py-10">
      <Card className="w-full max-w-4xl border-muted/60 bg-background/90 shadow-xl">
        <CardHeader className="space-y-4 pb-2 text-center items-center">
          <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">
            Acesso pendente
          </Badge>
          <CardTitle className="text-2xl">Conta aguardando liberação</CardTitle>
          <CardDescription className="text-base text-center">
            Sua conta ainda não foi liberada.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-start">
          <div className="space-y-4 rounded-2xl border bg-muted/30 p-5 text-left text-sm text-muted-foreground md:text-base">
            <p className="text-foreground/90">
              Para concluir a ativação, siga os passos abaixo:
            </p>
            <ol className="space-y-2">
              <li className="flex gap-3">
                <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600/15 text-xs font-semibold text-emerald-700">
                  1
                </span>
                <span>Realize o pagamento conforme as instruções recebidas.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600/15 text-xs font-semibold text-emerald-700">
                  2
                </span>
                <span>Informe o e-mail do Gmail cadastrado na plataforma.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600/15 text-xs font-semibold text-emerald-700">
                  3
                </span>
                <span>Envie o comprovante de pagamento ao administrador.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600/15 text-xs font-semibold text-emerald-700">
                  4
                </span>
                <span>Após a confirmação, atualize a página para acessar sua conta.</span>
              </li>
            </ol>
            <p>Se tiver qualquer dúvida, entre em contato com o suporte.</p>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 rounded-2xl border bg-muted/20 p-5 text-center">
              <Avatar className="h-14 w-14">
                <AvatarImage src={avatarUrl} alt="Foto do usuario" />
                <AvatarFallback>{displayName.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            {message ? (
              <p className="text-sm text-destructive text-center">{message}</p>
            ) : null}
            <div className="flex flex-col gap-2">
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => window.location.reload()}
              >
                🔄 Atualizar página
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                ⏻ Sair
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
