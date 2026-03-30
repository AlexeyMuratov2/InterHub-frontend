import { createContext, useContext, type ReactNode } from 'react';

export type MiniAppContextValue = {
  /** True when running the Telegram Mini App entry (MobileApp). */
  isMiniApp: boolean;
};

const defaultValue: MiniAppContextValue = { isMiniApp: false };

const MiniAppContext = createContext<MiniAppContextValue>(defaultValue);

export function MiniAppProvider({
  children,
  value = { isMiniApp: true },
}: {
  children: ReactNode;
  value?: MiniAppContextValue;
}) {
  return <MiniAppContext.Provider value={value}>{children}</MiniAppContext.Provider>;
}

export function useMiniApp(): MiniAppContextValue {
  return useContext(MiniAppContext);
}
