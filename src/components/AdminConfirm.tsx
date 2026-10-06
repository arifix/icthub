import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AlertTriangle, Check, X } from "lucide-react";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: "danger" | "primary";
};
type PendingConfirm = ConfirmOptions & { resolve: (confirmed: boolean) => void };
type ConfirmContextValue = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export const useAdminConfirm = () => {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useAdminConfirm must be used inside AdminConfirmProvider");
  return confirm;
};

export const AdminConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const confirm: ConfirmContextValue = (options) => new Promise((resolve) => setPending({ ...options, resolve }));
  const finish = useCallback((confirmed: boolean) => {
    pending?.resolve(confirmed);
    setPending(null);
  }, [pending]);
  useEffect(() => {
    if (!pending) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [finish, pending]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div className="admin-confirm-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) finish(false); }}>
          <section className="admin-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="admin-confirm-title" aria-describedby="admin-confirm-message">
            <button className="admin-confirm-close" onClick={() => finish(false)} aria-label="Close confirmation"><X size={18} /></button>
            <div className={`admin-confirm-icon ${pending.tone === "primary" ? "is-primary" : "is-danger"}`}><AlertTriangle size={21} /></div>
            <h2 id="admin-confirm-title">{pending.title}</h2>
            <p id="admin-confirm-message">{pending.message}</p>
            <div className="admin-confirm-actions">
              <button autoFocus className="admin-confirm-cancel" onClick={() => finish(false)}>Cancel</button>
              <button className={`admin-confirm-submit ${pending.tone === "primary" ? "is-primary" : "is-danger"}`} onClick={() => finish(true)}><Check size={16} />{pending.confirmLabel ?? "Confirm"}</button>
            </div>
          </section>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
