import { useEffect, useRef, useState } from "react";
import {
  Cloud,
  Copy,
  FolderOpen,
  HardDrive,
  KeyRound,
  LogIn,
  LogOut,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  UserPlus,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import {
  createBudgetId,
  deleteCloudBudget,
  mergeBudgets,
  readCloudBudgets,
  readLocalBudgets,
  removeBudget,
  saveCloudBudget,
  type SavedBudget,
  upsertBudget,
  writeLocalBudgets,
} from "../lib/savedBudgets";
import { supabase, supabaseConfigured } from "../lib/supabase";

type BudgetDraft = Omit<
  SavedBudget,
  "schemaVersion" | "id" | "createdAt" | "updatedAt"
>;

export function SavedBudgetLibrary({
  draft,
  currentId,
  currentCreatedAt,
  onCurrentChange,
  onLoad,
  onNew,
}: {
  draft: BudgetDraft;
  currentId: string | null;
  currentCreatedAt: string | null;
  onCurrentChange: (id: string, createdAt: string) => void;
  onLoad: (budget: SavedBudget) => void;
  onNew: () => void;
}) {
  const [budgets, setBudgets] = useState<SavedBudget[]>(readLocalBudgets);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!supabaseConfigured);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const onNewRef = useRef(onNew);

  useEffect(() => {
    onNewRef.current = onNew;
  }, [onNew]);

  useEffect(() => {
    const clear = () => {
      setBudgets([]);
      setMessage("Presupuestos locales eliminados.");
    };
    window.addEventListener("cerca-budgets-cleared", clear);
    return () => window.removeEventListener("cerca-budgets-cleared", clear);
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    const refreshSession = () => {
      void client.auth.getSession().then(({ data }) => {
        setSession(data.session);
        setAuthReady(true);
      });
    };
    refreshSession();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refreshSession();
    };
    window.addEventListener("pageshow", refreshSession);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    const { data } = client.auth.onAuthStateChange((event, next) => {
      setSession(next);
      setAuthReady(true);
      if (event === "SIGNED_IN") {
        setPassword("");
        setMessage("Acceso confirmado. Estamos sincronizando tus presupuestos.");
      } else if (event === "PASSWORD_RECOVERY") {
        setShowPasswordSetup(true);
        setMessage("Escribe una contraseña nueva para poder entrar sin esperar otro correo.");
      } else if (event === "SIGNED_OUT") {
        setBudgets(writeLocalBudgets([]));
        setPassword("");
        setNewPassword("");
        setShowPasswordSetup(false);
        onNewRef.current();
      }
    });
    return () => {
      data.subscription.unsubscribe();
      window.removeEventListener("pageshow", refreshSession);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    let active = true;
    const local = readLocalBudgets();
    void readCloudBudgets()
      .then(async (cloud) => {
        if (!active) return;
        const merged = mergeBudgets(local, cloud);
        await Promise.all(merged.map((budget) => saveCloudBudget(budget, session.user.id)));
        if (!active) return;
        setBudgets(merged);
        setMessage(merged.length
          ? `${merged.length} ${merged.length === 1 ? "presupuesto sincronizado" : "presupuestos sincronizados"} con la nube.`
          : "La nube está lista para guardar tu primer presupuesto.");
      })
      .catch(() => {
        if (active) setMessage("La sesión está activa, pero no se pudo acceder a la tabla de presupuestos. Comprueba que ejecutaste el SQL de configuración en Supabase.");
      })
    return () => { active = false; };
  }, [session]);

  function buildBudget(id: string, createdAt: string, changes: Partial<BudgetDraft> = {}): SavedBudget {
    return {
      schemaVersion: 1,
      id,
      ...draft,
      ...changes,
      createdAt,
      updatedAt: new Date().toISOString(),
    };
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    const id = currentId ?? createBudgetId();
    const createdAt = currentCreatedAt ?? new Date().toISOString();
    const budget = buildBudget(id, createdAt);
    setBudgets((current) => upsertBudget(current, budget));
    onCurrentChange(id, createdAt);
    try {
      if (session) {
        await saveCloudBudget(budget, session.user.id);
        setMessage("Presupuesto guardado en este dispositivo y en la nube.");
      } else {
        setMessage("Presupuesto guardado en este dispositivo.");
      }
    } catch {
      setMessage("Guardado en este dispositivo, pero la nube no respondió.");
    } finally {
      setBusy(false);
    }
  }

  async function duplicate(budget: SavedBudget) {
    if (busy) return;
    setBusy(true);
    const now = new Date().toISOString();
    const copy: SavedBudget = {
      ...budget,
      id: createBudgetId(),
      groupName: `${budget.groupName.trim() || "Presupuesto"} (copia)`,
      createdAt: now,
      updatedAt: now,
    };
    setBudgets((current) => upsertBudget(current, copy));
    onLoad(copy);
    try {
      if (session) await saveCloudBudget(copy, session.user.id);
      setMessage(session ? "Copia creada y guardada en la nube." : "Copia creada en este dispositivo.");
    } catch {
      setMessage("Copia creada en este dispositivo, pero la nube no respondió.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(budget: SavedBudget) {
    if (busy) return;
    setBusy(true);
    setBudgets((current) => removeBudget(current, budget.id));
    if (currentId === budget.id) onNew();
    try {
      if (session) await deleteCloudBudget(budget.id);
      setMessage("Presupuesto eliminado.");
    } catch {
      setMessage("Se eliminó de este dispositivo, pero no de la nube.");
    } finally {
      setBusy(false);
    }
  }

  async function sendMagicLink() {
    if (!supabase || busy) return;
    const address = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(address)) {
      setMessage("Escribe un correo válido.");
      return;
    }
    setBusy(true);
    const redirect = new URL(import.meta.env.BASE_URL, window.location.origin).href;
    const { error } = await supabase.auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: redirect },
    });
    if (!error) {
      setMessage("Enlace enviado. Ábrelo en este mismo navegador; al volver verás «Nube activa».");
    } else {
      const reason = `${error.code ?? ""} ${error.message}`.toLowerCase();
      const seconds = reason.match(/after\s+(\d+)\s+seconds?/i)?.[1];
      setMessage(
        seconds
          ? `Supabase limita la frecuencia de los correos. Espera ${seconds} segundos antes de solicitar otro enlace.`
          : reason.includes("rate") || reason.includes("limit")
            ? "Supabase ha alcanzado temporalmente el límite de correos del plan gratuito. Espera aproximadamente una hora antes de solicitar otro enlace."
            : `No se pudo enviar el enlace de acceso: ${error.message}`,
      );
    }
    setBusy(false);
  }

  async function signInWithPassword() {
    if (!supabase || busy) return;
    const address = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(address)) {
      setMessage("Escribe un correo válido.");
      return;
    }
    if (!password) {
      setMessage("Escribe tu contraseña.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: address, password });
    if (error) {
      const reason = `${error.code ?? ""} ${error.message}`.toLowerCase();
      setMessage(
        reason.includes("invalid") || reason.includes("credentials")
          ? "Correo o contraseña incorrectos. Si tu cuenta solo usaba enlaces, entra una última vez con un enlace y crea una contraseña."
          : reason.includes("confirm")
            ? "Confirma primero tu correo desde el mensaje que te envió Supabase."
            : `No se pudo iniciar sesión: ${error.message}`,
      );
    }
    setBusy(false);
  }

  async function createAccount() {
    if (!supabase || busy) return;
    const address = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(address)) {
      setMessage("Escribe un correo válido.");
      return;
    }
    if (password.length < 8) {
      setMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setBusy(true);
    const redirect = new URL(import.meta.env.BASE_URL, window.location.origin).href;
    const { data, error } = await supabase.auth.signUp({
      email: address,
      password,
      options: { emailRedirectTo: redirect },
    });
    if (error) {
      setMessage(`No se pudo crear la cuenta: ${error.message}`);
    } else if (!data.session && data.user?.identities?.length === 0) {
      setMessage("Ese correo ya tiene una cuenta. Entra con su contraseña o utiliza el enlace de acceso para crear una.");
    } else if (!data.session) {
      setMessage("Cuenta creada. Abre el correo de confirmación una sola vez; después podrás entrar siempre con tu contraseña.");
    }
    setBusy(false);
  }

  async function savePassword() {
    if (!supabase || !session || busy) return;
    if (newPassword.length < 8) {
      setMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setMessage(`No se pudo guardar la contraseña: ${error.message}`);
    } else {
      setNewPassword("");
      setShowPasswordSetup(false);
      setMessage("Contraseña guardada. A partir de ahora puedes entrar directamente con tu correo y contraseña.");
    }
    setBusy(false);
  }

  async function checkAccess() {
    if (!supabase || busy) return;
    setBusy(true);
    const { data, error } = await supabase.auth.getSession();
    setSession(data.session);
    setAuthReady(true);
    setMessage(error
      ? "No se pudo comprobar la sesión."
      : data.session
        ? "Acceso confirmado. Estamos sincronizando tus presupuestos."
        : "Todavía no hay una sesión activa. Abre el enlace del correo en este mismo navegador y vuelve a comprobarla.");
    setBusy(false);
  }

  async function signOut() {
    if (!supabase || busy) return;
    setBusy(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setMessage("No se pudo cerrar la sesión. Inténtalo de nuevo.");
      setBusy(false);
      return;
    }
    setSession(null);
    setBudgets(writeLocalBudgets([]));
    onNew();
    setMessage("Sesión cerrada. Los presupuestos de la cuenta ya no se muestran en este dispositivo.");
    setBusy(false);
  }

  return (
    <section className="budget-library" aria-labelledby="budget-library-title">
      <div className="budget-library-heading">
        <div>
          <p className="small-caps"><HardDrive size={15} /> MIS PRESUPUESTOS</p>
          <h2 id="budget-library-title">Guarda y continúa después</h2>
          <p>Sin iniciar sesión se conservan en este dispositivo. Con una cuenta se sincronizan en la nube y dejan de mostrarse al cerrar sesión.</p>
        </div>
        <div className="budget-library-actions">
          <button type="button" className="secondary-button" onClick={onNew} disabled={busy}>
            <Plus size={16} /> Nuevo
          </button>
          <button type="button" className="primary-button" onClick={() => void save()} disabled={busy}>
            <Save size={16} /> {currentId ? "Guardar cambios" : "Guardar presupuesto"}
          </button>
        </div>
      </div>

      {supabaseConfigured && (
        <div className="budget-cloud-account">
          {!authReady ? (
            <span><RefreshCw className="spin" size={16} /> Comprobando la sesión…</span>
          ) : session ? (
            <>
              <span><Cloud size={16} /> Nube activa · {session.user.email}</span>
              <button type="button" onClick={() => setShowPasswordSetup((current) => !current)} disabled={busy}>
                <KeyRound size={15} /> {showPasswordSetup ? "Cancelar" : "Crear o cambiar contraseña"}
              </button>
              <button type="button" onClick={() => void signOut()} disabled={busy}><LogOut size={15} /> Cerrar sesión</button>
              {showPasswordSetup && (
                <div className="budget-password-setup">
                  <label className="trip-field">Nueva contraseña
                    <input type="password" minLength={8} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Mínimo 8 caracteres" />
                  </label>
                  <button type="button" className="primary-button" onClick={() => void savePassword()} disabled={busy}>
                    <KeyRound size={16} /> Guardar contraseña
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="budget-cloud-help">Entra con contraseña siempre que quieras. Si tu cuenta anterior solo usaba enlaces, abre uno por última vez y crea una contraseña.</p>
              <label className="trip-field">Correo
                <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="equipo@ejemplo.es" />
              </label>
              <label className="trip-field">Contraseña
                <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Tu contraseña" />
              </label>
              <button type="button" className="primary-button" onClick={() => void signInWithPassword()} disabled={busy}>
                <LogIn size={16} /> Entrar
              </button>
              <button type="button" className="secondary-button" onClick={() => void createAccount()} disabled={busy}>
                <UserPlus size={16} /> Crear cuenta
              </button>
              <button type="button" className="secondary-button" onClick={() => void sendMagicLink()} disabled={busy}>
                <KeyRound size={16} /> Entrar con enlace una vez
              </button>
              <button type="button" onClick={() => void checkAccess()} disabled={busy}>
                <RefreshCw size={15} /> Ya he abierto el enlace
              </button>
            </>
          )}
        </div>
      )}

      {message && <p className="budget-save-message" role="status">{message}</p>}

      {budgets.length > 0 ? (
        <div className="budget-saved-list">
          {budgets.map((budget) => (
            <article className={budget.id === currentId ? "current" : ""} key={budget.id}>
              <div>
                <strong>{budget.groupName.trim() || "Presupuesto sin nombre"}</strong>
                <span>{budget.tournamentName.trim() || budget.destination}{budget.season.trim() ? ` · ${budget.season}` : ""}</span>
                <small>Actualizado {new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(budget.updatedAt))}</small>
              </div>
              <div className="budget-saved-actions">
                <button type="button" onClick={() => onLoad(budget)} disabled={busy}><FolderOpen size={15} /> Abrir</button>
                <button type="button" onClick={() => void duplicate(budget)} disabled={busy}><Copy size={15} /> Duplicar</button>
                <button type="button" aria-label={`Eliminar ${budget.groupName.trim() || "presupuesto"}`} onClick={() => void remove(budget)} disabled={busy}><Trash2 size={15} /></button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="budget-empty">Todavía no hay presupuestos guardados.</p>
      )}
    </section>
  );
}
