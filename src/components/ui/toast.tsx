"use client";

import { Toast } from "@base-ui/react/toast";
import type React from "react";
import { AnchoredToasts } from "@/components/ui/toast-anchored";
import type { ToastPosition } from "@/components/ui/toast-helpers";
import { ToastList } from "@/components/ui/toast-list";

export type { ToastPosition };

export const toastManager: ReturnType<typeof Toast.createToastManager> =
  Toast.createToastManager();

export const anchoredToastManager: ReturnType<typeof Toast.createToastManager> =
  Toast.createToastManager();

export interface ToastProviderProps extends Toast.Provider.Props {
  position?: ToastPosition;
  portalProps?: React.ComponentProps<typeof Toast.Portal>;
}

export function ToastProvider({
  children,
  position = "bottom-right",
  portalProps,
  ...props
}: ToastProviderProps): React.ReactElement {
  return (
    <Toast.Provider toastManager={toastManager} {...props}>
      {children}
      <ToastList portalProps={portalProps} position={position} />
    </Toast.Provider>
  );
}

export interface AnchoredToastProviderProps extends Toast.Provider.Props {
  portalProps?: React.ComponentProps<typeof Toast.Portal>;
}

export function AnchoredToastProvider({
  children,
  portalProps,
  ...props
}: AnchoredToastProviderProps): React.ReactElement {
  return (
    <Toast.Provider toastManager={anchoredToastManager} {...props}>
      {children}
      <AnchoredToasts portalProps={portalProps} />
    </Toast.Provider>
  );
}

export { Toast as ToastPrimitive };
