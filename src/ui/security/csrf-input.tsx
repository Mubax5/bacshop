"use client";

import { createContext, useContext } from "react";

const CsrfContext = createContext<string | null>(null);

export function CsrfProvider({ token, children }: { token: string; children?: React.ReactNode }) {
  return <CsrfContext.Provider value={token}>{children}</CsrfContext.Provider>;
}

/** One request token is shared by server-rendered and client-rendered forms. */
export function CsrfInput() {
  const token = useContext(CsrfContext);
  if (!token) throw new Error("CSRF provider is required for state-changing forms");
  return <input type="hidden" name="csrf" value={token} />;
}
