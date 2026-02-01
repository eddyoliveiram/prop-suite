"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), []);
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
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
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
      setLoading(false);
    };

    loadSession();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const loadUsers = async () => {
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

  const requestConfirm = (label, onConfirm, requiredWord = "") => {
    setConfirmInput("");
    setConfirmState({ label, onConfirm, requiredWord });
  };

  const closeConfirm = () => {
    setConfirmInput("");
    setConfirmState(null);
  };

  const toggleUserFlag = async (userId, field, nextValue, label) => {
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
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <main className="app-shell">
        <section className="card">
          <p className="loading">Carregando...</p>
        </section>
      </main>
    );
  }

  if (!user) {
    return null;
  }

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

  const displayName = profile?.full_name || "Usuario";
  const roleLabel = profile?.is_admin ? "Administrador" : "Usuario";
  const avatarUrl =
    profile?.avatar_url ||
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    "https://www.gravatar.com/avatar/?d=mp";

  return (
    <main className="app-shell">
      <section className="dashboard-shell">
        <aside className="sidebar">
          <div className="sidebar-top">
            <p className="eyebrow">PropSuite</p>
            <div className="sidebar-user">
              <img className="sidebar-avatar" src={avatarUrl} alt="Foto do usuario" />
              <div>
                <span className="sidebar-name">{displayName}</span>
                <span className="sidebar-role">{roleLabel}</span>
              </div>
            </div>
          </div>
          <nav className="menu-list">
            {profile?.is_admin ? (
              <button
                className={`menu-link${activeSection === "users" ? " active" : ""}`}
                type="button"
                onClick={() => setActiveSection("users")}
              >
                <span className="menu-icon" aria-hidden="true">👥</span>
                Gerenciar usuarios
              </button>
            ) : null}
            <button
              className={`menu-link${activeSection === "wallet" ? " active" : ""}`}
              type="button"
              onClick={() => setActiveSection("wallet")}
            >
              <span className="menu-icon" aria-hidden="true">💼</span>
              Carteira de contas
            </button>
          </nav>
          <div className="menu-footer">
            <button className="menu-link danger" type="button" onClick={handleLogout}>
              <span className="menu-icon" aria-hidden="true">⏻</span>
              Sair
            </button>
          </div>
        </aside>
        <div className="dashboard-content">
          {activeSection === "wallet" ? (
            <div className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Carteira de contas</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Controle</p>
                  <h1 className="title">Usuarios do sistema</h1>
                </div>
                <div className="table-toolbar">
                  <input
                    className="table-search"
                    type="search"
                    placeholder="Pesquisar por nome ou email"
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </div>
              {usersLoading ? (
                <p className="loading">Carregando usuarios...</p>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Admin</th>
                        <th>Liberado</th>
                        <th>Cadastro</th>
                        <th>Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedUsers.length ? (
                        pagedUsers.map((item) => (
                          <tr key={item.id}>
                            <td>{item.full_name || "-"}</td>
                            <td>{item.email || "-"}</td>
                            <td>
                              <span
                                className={`status-pill ${
                                  item.is_admin ? "ok" : "no"
                                }`}
                              >
                                {item.is_admin ? "Sim" : "Nao"}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`status-pill ${
                                  item.is_approved ? "ok" : "no"
                                }`}
                              >
                                {item.is_approved ? "Sim" : "Nao"}
                              </span>
                            </td>
                            <td>
                              {item.created_at
                                ? new Date(item.created_at).toLocaleDateString("pt-BR")
                                : "-"}
                            </td>
                            <td>
                              <div className="table-actions">
                                <button
                                  className={`table-button ${
                                    item.is_admin ? "danger" : "info"
                                  }`}
                                  type="button"
                                  disabled={usersBusyId === item.id}
                                  onClick={() =>
                                    requestConfirm(
                                      item.is_admin
                                        ? "Remover admin"
                                        : "Tornar admin",
                                      () =>
                                        toggleUserFlag(
                                          item.id,
                                          "is_admin",
                                          !item.is_admin,
                                          item.is_admin
                                            ? "Remover admin"
                                            : "Tornar admin"
                                        ),
                                      "admin"
                                    )
                                  }
                                >
                                  {item.is_admin ? "Remover admin" : "Tornar admin"}
                                </button>
                                <button
                                  className={`table-button ${
                                    item.is_approved ? "danger" : "success"
                                  }`}
                                  type="button"
                                  disabled={usersBusyId === item.id}
                                  onClick={() =>
                                    requestConfirm(
                                      item.is_approved
                                        ? "Cancelar liberacao"
                                        : "Liberar usuario",
                                      () =>
                                        toggleUserFlag(
                                          item.id,
                                          "is_approved",
                                          !item.is_approved,
                                          item.is_approved
                                            ? "Cancelar liberacao"
                                            : "Liberar usuario"
                                        )
                                    )
                                  }
                                >
                                  {item.is_approved ? "Cancelar liberacao" : "Liberar"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6}>Nenhum usuario encontrado.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="table-pagination">
                <span className="table-meta">
                  {filteredUsers.length} usuario(s)
                </span>
                <div className="table-pages">
                  <button
                    className="table-button secondary"
                    type="button"
                    disabled={safePage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  >
                    Anterior
                  </button>
                  <span className="table-page-info">
                    Pagina {safePage} de {totalPages}
                  </span>
                  <button
                    className="table-button"
                    type="button"
                    disabled={safePage === totalPages}
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                  >
                    Proxima
                  </button>
                </div>
              </div>
            </div>
          )}
          {message ? <p className="status">{message}</p> : null}
        </div>
      </section>
      {confirmState ? (
        <div className="modal-backdrop">
          <div className="modal">
            <p className="modal-title">Confirmar acao</p>
            <p className="modal-text">
              Tem certeza que deseja{" "}
              <strong>{confirmState.label.toLowerCase()}</strong>?
            </p>
            {confirmState.requiredWord ? (
              <div className="modal-field">
                <label className="modal-label" htmlFor="confirm-input">
                  Digite <strong>{confirmState.requiredWord}</strong> para
                  confirmar
                </label>
                <input
                  id="confirm-input"
                  className="modal-input"
                  type="text"
                  value={confirmInput}
                  onChange={(event) => setConfirmInput(event.target.value)}
                  placeholder={confirmState.requiredWord}
                  autoComplete="off"
                />
              </div>
            ) : null}
            <div className="modal-actions">
              <button className="button secondary" type="button" onClick={closeConfirm}>
                Cancelar
              </button>
              <button
                className="button"
                type="button"
                disabled={
                  confirmState.requiredWord &&
                  confirmInput.trim().toLowerCase() !==
                    confirmState.requiredWord.toLowerCase()
                }
                onClick={async () => {
                  const action = confirmState.onConfirm;
                  closeConfirm();
                  await action();
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
