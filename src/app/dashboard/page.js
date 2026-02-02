"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const [supabase, setSupabase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");
  const [activeSection, setActiveSection] = useState("wallet");
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersBusyId, setUsersBusyId] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [confirmInput, setConfirmInput] = useState("");
  const [advanceTarget, setAdvanceTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mesaFilter, setMesaFilter] = useState("all");
  const [idFilter, setIdFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [mesaOption, setMesaOption] = useState("LUCID 50K");
  const [mesaCustom, setMesaCustom] = useState("");
  const [accountLogin, setAccountLogin] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSupabase(createClient());
    const saved = window.localStorage.getItem("propsuite-sidebar");
    if (saved === "open") setSidebarOpen(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "propsuite-sidebar",
      sidebarOpen ? "open" : "closed"
    );
  }, [sidebarOpen]);

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
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, is_admin, is_approved, email")
        .eq("id", currentUser.id)
        .single();
      if (profileError) {
        setMessage("Nao foi possivel carregar seu perfil.");
        setLoading(false);
        return;
      }
      setProfile(profileData);
      if (!profileData?.is_admin && !profileData?.is_approved) {
        window.location.href = "/welcome";
        return;
      }
      if (profileData?.is_admin) {
        await loadUsers();
      }
      await loadAccounts(currentUser.id);
      setLoading(false);
    };

    loadSession();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const loadUsers = async () => {
    if (!supabase) return;
    setUsersLoading(true);
    const { data: usersData, error: usersError } = await supabase
      .from("profiles")
      .select("id, full_name, email, is_admin, is_approved, created_at")
      .order("created_at", { ascending: false });
    if (usersError) {
      setMessage("Nao foi possivel carregar a lista de usuarios.");
    } else {
      setUsers(usersData ?? []);
    }
    setUsersLoading(false);
  };

  const tradeTemplateByStageDay = {
    approval: {
      1: [
        { amount: 2000, profit: 500 },
        { amount: 2500, profit: 500 },
        { amount: 3000, profit: 500 },
      ],
      2: [
        { amount: 2000, profit: 500 },
        { amount: 2500, profit: 500 },
        { amount: 3000, profit: 500 },
      ],
    },
    cushion: {
      3: [
        { amount: 2000, profit: 500 },
        { amount: 2500, profit: 500 },
        { amount: 3000, profit: 500 },
        { amount: 3500, profit: 500 },
      ],
    },
    withdraw: {
      4: [{ amount: 2000, profit: 250 }],
      5: [{ amount: 2250, profit: 250 }],
      6: [{ amount: 2500, profit: 250 }],
      7: [{ amount: 2750, profit: 250 }],
    },
    post_withdraw: {
      1: [{ amount: 1400, profit: 300 }],
      2: [{ amount: 1700, profit: 300 }],
      3: [{ amount: 2000, profit: 300 }],
      4: [{ amount: 2300, profit: 300 }],
      5: [{ amount: 2600, profit: 300 }],
    },
  };

  const loadAccounts = async (userId) => {
    if (!supabase || !userId) return;
    setAccountsLoading(true);
    const { data: accountsData, error: accountsError } = await supabase
      .from("accounts")
      .select("id, mesa, login, stage, day, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (accountsError) {
      setMessage("Nao foi possivel carregar suas contas.");
    } else {
      setAccounts(accountsData ?? []);
    }
    setAccountsLoading(false);
  };

  const requestConfirm = (label, onConfirm, requiredWord = "") => {
    setConfirmInput("");
    setConfirmState({ label, onConfirm, requiredWord });
  };

  const closeConfirm = () => {
    setConfirmInput("");
    setConfirmState(null);
  };

  const closeAdvance = () => {
    setAdvanceTarget(null);
  };

  const closeDelete = () => {
    setDeleteTarget(null);
  };

  const toggleUserFlag = async (userId, field, nextValue) => {
    if (!supabase) return;
    setUsersBusyId(userId);
    const { error } = await supabase
      .from("profiles")
      .update({ [field]: nextValue, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) {
      setMessage("Nao foi possivel atualizar o usuario.");
    } else {
      setUsers((prev) =>
        prev.map((item) =>
          item.id === userId ? { ...item, [field]: nextValue } : item
        )
      );
    }
    setUsersBusyId(null);
  };


  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const advanceAccountDay = async () => {
    if (!supabase || !advanceTarget) return;
    const { accountId, nextDay, nextStage } = advanceTarget;
    const { error } = await supabase
      .from("accounts")
      .update({
        day: nextDay,
        stage: nextStage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", accountId);
    if (error) {
      setMessage("Nao foi possivel avancar a conta.");
    } else {
      setAccounts((prev) =>
        prev.map((item) =>
          item.id === accountId
            ? { ...item, day: nextDay, stage: nextStage }
            : item
        )
      );
    }
    closeAdvance();
  };

  const deleteAccount = async () => {
    if (!supabase || !deleteTarget) return;
    const { accountId } = deleteTarget;
    const { error } = await supabase.from("accounts").delete().eq("id", accountId);
    if (error) {
      setMessage("Nao foi possivel excluir a conta.");
    } else {
      setAccounts((prev) => prev.filter((item) => item.id !== accountId));
    }
    closeDelete();
  };

  const getNextStep = (stage, day) => {
    if (stage === "approval" && day === 1) return { nextDay: 2, nextStage: "approval" };
    if (stage === "approval" && day === 2) return { nextDay: 3, nextStage: "cushion" };
    if (stage === "cushion" && day === 3) return { nextDay: 4, nextStage: "withdraw" };
    if (stage === "withdraw" && day >= 4 && day < 7)
      return { nextDay: day + 1, nextStage: "withdraw" };
    if (stage === "withdraw" && day === 7)
      return { nextDay: 1, nextStage: "awaiting_payment" };
    if (stage === "awaiting_payment")
      return { nextDay: 1, nextStage: "post_withdraw" };
    if (stage === "post_withdraw" && day < 5)
      return { nextDay: day + 1, nextStage: "post_withdraw" };
    if (stage === "post_withdraw" && day === 5)
      return { nextDay: 1, nextStage: "awaiting_payment" };
    return null;
  };

  const getQuestionForStageDay = (stage, day) => {
    if (stage === "awaiting_payment") return "O pagamento foi recebido?";
    const tradeCount = tradeTemplateByStageDay[stage]?.[day]?.length ?? 0;
    if (tradeCount === 1) return "O trade do dia foi feito?";
    return `Os ${tradeCount} trades do dia foram feitos?`;
  };

  const handleCreateAccount = async (event) => {
    event.preventDefault();
    const mesa =
      mesaOption === "custom" ? mesaCustom.trim() : mesaOption.trim();
    if (!mesa || !accountLogin.trim() || !user) return;

    const { data: newAccount, error: accountError } = await supabase
      .from("accounts")
      .insert({
        user_id: user.id,
        mesa,
        login: accountLogin.trim(),
        stage: "approval",
        day: 1,
      })
      .select()
      .single();

    if (accountError || !newAccount) {
      console.error("Erro ao cadastrar conta:", accountError);
      setMessage(
        `Nao foi possivel cadastrar a conta.${
          accountError?.message ? ` (${accountError.message})` : ""
        }`
      );
      return;
    }

    setMesaOption("LUCID 50K");
    setMesaCustom("");
    setAccountLogin("");
    setShowAccountModal(false);
    await loadAccounts(user.id);
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
    return null;
  }

  const displayName = profile?.full_name || "Usuario";
  const roleLabel = profile?.is_admin ? "Administrador" : "Usuario";
  const avatarUrl =
    profile?.avatar_url ||
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    "https://www.gravatar.com/avatar/?d=mp";

  const filteredUsers = users.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.full_name || "").toLowerCase().includes(term) ||
      (item.email || "").toLowerCase().includes(term)
    );
  });
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pagedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  const filteredAccounts = accounts.filter((account) => {
    const byMesa = mesaFilter === "all" || account.mesa === mesaFilter;
    const byId =
      !idFilter.trim() ||
      account.login.toLowerCase().includes(idFilter.trim().toLowerCase());
    return byMesa && byId;
  });

  const mesasDisponiveis = Array.from(
    new Set(accounts.map((account) => account.mesa))
  );

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="relative min-h-screen w-full p-6">
        <aside
          className={`fixed left-6 top-6 z-40 h-[calc(100vh-3rem)] w-[260px] flex-col rounded-2xl border bg-background/90 p-5 shadow-lg backdrop-blur transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-[110%]"
          }`}
        >
          <div className="space-y-5">
            <div className="relative flex items-center justify-center">
              <div className="text-center text-2xl text-foreground [font-family:var(--font-story-script)]">
                PropSuite
              </div>
              <button
                type="button"
                className="absolute right-0 rounded-full border bg-background/90 px-2 py-1 text-xs text-muted-foreground"
                onClick={() => setSidebarOpen(false)}
                aria-label="Fechar menu"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col items-center gap-3 text-center">
              <Avatar className="h-12 w-12">
                <AvatarImage src={avatarUrl} alt="Foto do usuario" />
                <AvatarFallback>{displayName.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {displayName}
                </p>
                <p className="text-xs text-muted-foreground">{roleLabel}</p>
              </div>
            </div>
          </div>
          <Separator className="my-6" />
          <nav className="flex flex-col gap-2">
            {profile?.is_admin ? (
              <Button
                variant={activeSection === "users" ? "secondary" : "ghost"}
                className="justify-start gap-2"
                onClick={() => setActiveSection("users")}
              >
                <span>👥</span>
                Gerenciar usuarios
              </Button>
            ) : null}
            <Button
              variant={activeSection === "wallet" ? "secondary" : "ghost"}
              className="justify-start gap-2"
              onClick={() => setActiveSection("wallet")}
            >
              <span>💼</span>
              Carteira de contas
            </Button>
          </nav>
          <div className="mt-auto">
            <Separator className="my-6" />
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogout}
            >
              ⏻ Sair
            </Button>
          </div>
        </aside>

        {sidebarOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/40"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu"
          />
        ) : null}

        <button
          type="button"
          className="absolute left-6 top-6 z-20 flex h-11 w-11 items-center justify-center rounded-full border bg-background/90 shadow-sm"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menu"
        >
          ☰
        </button>

        <section className="flex flex-col gap-6 pl-0 pt-14">
          {activeSection === "wallet" ? (
            <Card className="border-muted/60">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Carteira de contas</CardTitle>
                  <CardDescription>
                    Organize suas contas por fase e acompanhe a evolucao.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={mesaFilter} onValueChange={setMesaFilter}>
                    <SelectTrigger className="h-9 w-[180px] text-xs">
                      <SelectValue placeholder="Mesa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as mesas</SelectItem>
                      {mesasDisponiveis.map((mesa) => (
                        <SelectItem key={mesa} value={mesa}>
                          {mesa}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={idFilter}
                    onChange={(event) => setIdFilter(event.target.value)}
                    placeholder="Pesquisar por ID"
                    className="h-9 w-[180px] text-xs"
                  />
                  <Button
                    className="h-9 bg-emerald-600 text-xs hover:bg-emerald-700"
                    onClick={() => {
                      setMesaOption("LUCID 50K");
                      setMesaCustom("");
                      setAccountLogin("");
                      setShowAccountModal(true);
                    }}
                  >
                    ➕ Adicionar nova conta
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 lg:grid-cols-3">
                  {[
                    {
                      key: "approval",
                      title: "APROVAÇÃO",
                      days: [
                        { label: "DIA 01", value: 1 },
                        { label: "DIA 02", value: 2 },
                      ],
                    },
                    {
                      key: "cushion",
                      title: "COLCHÃO",
                      days: [{ label: "DIA 03", value: 3 }],
                    },
                    {
                      key: "withdraw",
                      title: "SAQUE",
                      days: [
                        { label: "DIA 04", value: 4 },
                        { label: "DIA 05", value: 5 },
                        { label: "DIA 06", value: 6 },
                        { label: "DIA 07", value: 7 },
                      ],
                    },
                  ].map((column) => {
                    const items = filteredAccounts.filter(
                      (account) => account.stage === column.key
                    );
                    return (
                      <Card
                        key={column.key}
                        className={`border-muted/60 ${
                          column.key === "approval"
                            ? "bg-amber-50/80"
                            : column.key === "cushion"
                              ? "bg-blue-50/80"
                              : "bg-emerald-50/80"
                        }`}
                      >
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle className="text-sm font-semibold tracking-[0.2em] text-muted-foreground">
                            {column.title}
                          </CardTitle>
                          <Badge variant="secondary">{items.length}</Badge>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {column.days.map((day) => {
                            const dayItems = items.filter(
                              (account) => account.day === day.value
                            );
                            return (
                              <Card key={day.label} className="w-full border-muted/60">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-xs font-semibold tracking-[0.2em] text-muted-foreground">
                                    {day.label}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="flex gap-3 overflow-x-auto pb-2">
                                    {dayItems.length ? (
                                      dayItems.map((account) => {
                                        const accountTrades =
                                          tradeTemplateByStageDay[column.key]?.[
                                            day.value
                                          ] || [];
                                        return (
                                          <Card
                                            key={account.id}
                                            className="min-w-[200px] border-muted/60"
                                          >
                                            <CardHeader className="pb-1 pt-3">
                                              <div className="flex items-center justify-between gap-2">
                                                <CardTitle className="text-xs font-semibold">
                                                  {account.mesa} | {account.login}
                                                </CardTitle>
                                                <button
                                                  type="button"
                                                  className="rounded-md border border-rose-200/60 p-1 text-rose-500 hover:text-rose-600"
                                                  onClick={() =>
                                                    setDeleteTarget({
                                                      accountId: account.id,
                                                    })
                                                  }
                                                >
                                                  <span className="text-[10px]">🗑️</span>
                                                </button>
                                              </div>
                                            </CardHeader>
                                            <CardContent className="space-y-2 text-center">
                                              <ul className="mx-auto w-fit list-disc space-y-1 pl-4 text-sm text-muted-foreground text-left">
                                                {accountTrades.map((trade, idx) => (
                                                  <li key={`${account.id}-${day.value}-${idx}`}>
                                                    <span className="text-rose-500">
                                                      ${trade.amount}
                                                    </span>{" "}
                                                    =&gt;{" "}
                                                    <span className="text-emerald-600">
                                                      ${trade.profit}
                                                    </span>
                                                  </li>
                                                ))}
                                              </ul>
                                              {getNextStep(column.key, day.value) ? (
                                                <div className="flex items-center justify-center gap-2">
                                                  <Button
                                                    size="sm"
                                                    className="h-7 w-full px-3 text-[11px] bg-emerald-600 hover:bg-emerald-700"
                                                    onClick={() =>
                                                      setAdvanceTarget({
                                                        accountId: account.id,
                                                        ...getNextStep(
                                                          column.key,
                                                          day.value
                                                        ),
                                                        question: getQuestionForStageDay(
                                                          column.key,
                                                          day.value
                                                        ),
                                                      })
                                                    }
                                                  >
                                                    ➜ Avançar
                                                  </Button>
                                                </div>
                                              ) : null}
                                            </CardContent>
                                          </Card>
                                        );
                                      })
                                    ) : (
                                      <p className="text-xs text-muted-foreground">
                                        Nenhuma conta neste dia.
                                      </p>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                          {accountsLoading ? (
                            <p className="text-xs text-muted-foreground">
                              Carregando contas...
                            </p>
                          ) : null}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <Card className="border-muted/60 bg-amber-100/50">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-semibold tracking-[0.2em] text-muted-foreground">
                        AGUARDANDO PAGAMENTO
                      </CardTitle>
                      <Badge variant="secondary">
                        {accounts.filter((a) => a.stage === "awaiting_payment").length}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {filteredAccounts
                        .filter((a) => a.stage === "awaiting_payment")
                        .map((account) => (
                          <Card key={account.id} className="border-muted/60">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between gap-2">
                                <CardTitle className="text-xs font-semibold">
                                  {account.mesa} | {account.login}
                                </CardTitle>
                                <button
                                  type="button"
                                  className="rounded-md border border-rose-200/60 p-1 text-rose-500 hover:text-rose-600"
                                  onClick={() =>
                                    setDeleteTarget({
                                      accountId: account.id,
                                    })
                                  }
                                >
                                  <span className="text-[10px]">🗑️</span>
                                </button>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2 text-center">
                              <Button
                                size="sm"
                                className="h-7 w-full px-3 text-[11px] bg-emerald-600 hover:bg-emerald-700"
                                onClick={() =>
                                  setAdvanceTarget({
                                    accountId: account.id,
                                    ...getNextStep("awaiting_payment", 1),
                                    question: getQuestionForStageDay(
                                      "awaiting_payment",
                                      1
                                    ),
                                  })
                                }
                              >
                                ➜ Avançar
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      {filteredAccounts.filter((a) => a.stage === "awaiting_payment").length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Nenhuma conta nesta fase.
                        </p>
                      ) : null}
                    </CardContent>
                  </Card>

                  <Card className="border-muted/60 bg-emerald-50/80">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-semibold tracking-[0.2em] text-muted-foreground">
                        PÓS 1º SAQUE
                      </CardTitle>
                      <Badge variant="secondary">
                        {filteredAccounts.filter((a) => a.stage === "post_withdraw").length}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[1, 2, 3, 4, 5].map((day) => {
                        const dayItems = filteredAccounts.filter(
                          (a) => a.stage === "post_withdraw" && a.day === day
                        );
                        const dayTrades =
                          tradeTemplateByStageDay.post_withdraw?.[day] || [];
                        return (
                          <Card key={day} className="w-full border-muted/60">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-xs font-semibold tracking-[0.2em] text-muted-foreground">
                                DIA {String(day).padStart(2, "0")}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex gap-3 overflow-x-auto pb-2">
                                {dayItems.length ? (
                                  dayItems.map((account) => (
                                    <Card
                                      key={account.id}
                                      className="min-w-[240px] border-muted/60"
                                    >
                                      <CardHeader className="pb-1 pt-3">
                                        <div className="flex items-center justify-between gap-2">
                                          <CardTitle className="text-xs font-semibold">
                                            {account.mesa} | {account.login}
                                          </CardTitle>
                                          <button
                                            type="button"
                                            className="rounded-md border border-rose-200/60 p-1 text-rose-500 hover:text-rose-600"
                                            onClick={() =>
                                              setDeleteTarget({
                                                accountId: account.id,
                                              })
                                            }
                                          >
                                            <span className="text-[10px]">🗑️</span>
                                          </button>
                                        </div>
                                      </CardHeader>
                                      <CardContent className="space-y-2 text-center">
                                        <ul className="mx-auto w-fit list-disc space-y-1 pl-4 text-sm text-muted-foreground text-left">
                                          {dayTrades.map((trade, idx) => (
                                            <li key={`${account.id}-${day}-${idx}`}>
                                              <span className="text-rose-500">
                                                ${trade.amount}
                                              </span>{" "}
                                              =&gt;{" "}
                                              <span className="text-emerald-600">
                                                ${trade.profit}
                                              </span>
                                            </li>
                                          ))}
                                        </ul>
                                        {getNextStep("post_withdraw", day) ? (
                                          <Button
                                            size="sm"
                                            className="h-7 w-full px-3 text-[11px] bg-emerald-600 hover:bg-emerald-700"
                                            onClick={() =>
                                              setAdvanceTarget({
                                                accountId: account.id,
                                                ...getNextStep("post_withdraw", day),
                                                question: getQuestionForStageDay(
                                                  "post_withdraw",
                                                  day
                                                ),
                                              })
                                            }
                                          >
                                            ➜ Avançar
                                          </Button>
                                        ) : null}
                                      </CardContent>
                                    </Card>
                                  ))
                                ) : (
                                  <p className="text-xs text-muted-foreground">
                                    Nenhuma conta neste dia.
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-muted/60">
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-lg">Usuarios do sistema</CardTitle>
                  <CardDescription>
                    Gerencie permissoes e liberacoes.
                  </CardDescription>
                </div>
                <div className="w-full md:max-w-xs">
                  <Input
                    placeholder="Pesquisar por nome ou email"
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {usersLoading ? (
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Admin</TableHead>
                          <TableHead>Liberado</TableHead>
                          <TableHead>Cadastro</TableHead>
                          <TableHead className="text-right">Acoes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedUsers.length ? (
                          pagedUsers.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.full_name || "-"}</TableCell>
                              <TableCell>{item.email || "-"}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={item.is_admin ? "default" : "secondary"}
                                  className={
                                    item.is_admin
                                      ? "bg-emerald-600 text-white"
                                      : "text-foreground"
                                  }
                                >
                                  {item.is_admin ? "Sim" : "Nao"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={item.is_approved ? "default" : "secondary"}
                                  className={
                                    item.is_approved
                                      ? "bg-emerald-600 text-white"
                                      : "text-foreground"
                                  }
                                >
                                  {item.is_approved ? "Sim" : "Nao"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {item.created_at
                                  ? new Date(item.created_at).toLocaleDateString("pt-BR")
                                  : "-"}
                              </TableCell>
                              <TableCell className="space-y-2 text-right">
                                <div className="flex flex-wrap justify-end gap-2">
                                  <Button
                                    size="sm"
                                    disabled={usersBusyId === item.id}
                                    className={
                                      item.is_admin
                                        ? "bg-rose-600 hover:bg-rose-700"
                                        : "bg-blue-600 hover:bg-blue-700"
                                    }
                                    onClick={() =>
                                      requestConfirm(
                                        item.is_admin
                                          ? "Remover admin"
                                          : "Tornar admin",
                                        () =>
                                          toggleUserFlag(
                                            item.id,
                                            "is_admin",
                                            !item.is_admin
                                          ),
                                        "admin"
                                      )
                                    }
                                  >
                                    {item.is_admin ? "Remover admin" : "Tornar admin"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={item.is_approved ? "destructive" : "secondary"}
                                    disabled={usersBusyId === item.id}
                                    className={
                                      item.is_approved
                                        ? "bg-rose-600 hover:bg-rose-700"
                                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                                    }
                                    onClick={() =>
                                      requestConfirm(
                                        item.is_approved
                                          ? "Cancelar liberacao"
                                          : "Liberar usuario",
                                        () =>
                                          toggleUserFlag(
                                            item.id,
                                            "is_approved",
                                            !item.is_approved
                                          )
                                      )
                                    }
                                  >
                                    {item.is_approved ? "Cancelar" : "Liberar"}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center">
                              Nenhum usuario encontrado.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                  <span>{filteredUsers.length} usuario(s)</span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={safePage === 1}
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    >
                      Anterior
                    </Button>
                    <span>
                      Pagina {safePage} de {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={safePage === totalPages}
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                    >
                      Proxima
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {message ? <p className="text-sm text-destructive">{message}</p> : null}
        </section>
      </div>

      <Dialog open={showAccountModal} onOpenChange={setShowAccountModal}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Adicionar nova conta</DialogTitle>
            <DialogDescription>
              Preencha os dados da mesa e o login da conta.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreateAccount}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mesa</label>
              <Select value={mesaOption} onValueChange={setMesaOption}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
              <SelectItem value="LUCID 50K">LUCID 50K</SelectItem>
              <SelectItem value="TOPSTEP 50K">TOPSTEP 50K</SelectItem>
                  <SelectItem value="custom">Outra (digitar)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {mesaOption === "custom" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome da mesa</label>
                <Input
                  value={mesaCustom}
                  onChange={(event) => setMesaCustom(event.target.value)}
                  placeholder="Ex: Mesa X 50k"
                  required
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <label className="text-sm font-medium">ID/Login da conta</label>
              <Input
                value={accountLogin}
                onChange={(event) => setAccountLogin(event.target.value)}
                placeholder="Ex: 123456"
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAccountModal(false)}
              >
                ✖ Cancelar
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                ✔ Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmState} onOpenChange={(open) => !open && closeConfirm()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar acao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja {confirmState?.label.toLowerCase()}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {confirmState?.requiredWord ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Digite <strong>{confirmState.requiredWord}</strong> para confirmar
              </label>
              <Input
                value={confirmInput}
                onChange={(event) => setConfirmInput(event.target.value)}
                placeholder={confirmState.requiredWord}
              />
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>✖ Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={
                confirmState?.requiredWord &&
                confirmInput.trim().toLowerCase() !==
                  confirmState.requiredWord.toLowerCase()
              }
              onClick={async () => {
                const action = confirmState?.onConfirm;
                closeConfirm();
                if (action) await action();
              }}
            >
              ✔ Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!advanceTarget} onOpenChange={(open) => !open && closeAdvance()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar avanço</AlertDialogTitle>
            <AlertDialogDescription>
              {advanceTarget?.question || "Confirmar avanço para o próximo dia?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeAdvance}>✖ Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={advanceAccountDay}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              ✔ Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && closeDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta conta? Essa acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDelete}>✖ Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 text-white hover:bg-rose-700" onClick={deleteAccount}>
              🗑 Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
