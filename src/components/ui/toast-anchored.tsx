"use client";

import { Toast } from "@base-ui/react/toast";
import type React from "react";
import { buttonVariants } from "@/components/ui/button";
import { TOAST_ICONS, type ToastData, upsertReplayClassName } from "@/components/ui/toast-helpers";
import { cn } from "@/lib/utils";

export function AnchoredToasts({
  portalProps,
}: {
  portalProps?: React.ComponentProps<typeof Toast.Portal>;
}): React.ReactElement {
  const { toasts } = Toast.useToastManager();

  return (
    <Toast.Portal data-slot="toast-portal-anchored" {...portalProps}>
      <Toast.Viewport className="outline-none" data-slot="toast-viewport-anchored">
        {toasts.map((toast) => {
          const Icon = toast.type ? TOAST_ICONS[toast.type as keyof typeof TOAST_ICONS] : null;
          const toastData = toast.data as ToastData | undefined;
          const tooltipStyle = toastData?.tooltipStyle ?? false;
          const positionerProps = toast.positionerProps;

          if (!positionerProps?.anchor) {
            return null;
          }

          return (
            <Toast.Positioner
              key={toast.id}
              className="z-60 max-w-[min(--spacing(64),var(--available-width))]"
              data-slot="toast-positioner"
              sideOffset={positionerProps.sideOffset ?? 4}
              toast={toast}
            >
              <Toast.Root
                className={cn(
                  "relative text-balance border bg-popover not-dark:bg-clip-padding text-popover-foreground text-xs transition-[scale,opacity] before:pointer-events-none before:absolute before:inset-0 before:shadow-[0_1px_--theme(--color-black/4%)] data-ending-style:opacity-0 data-starting-style:opacity-0 motion-safe:data-ending-style:scale-98 motion-safe:data-starting-style:scale-98 dark:before:shadow-[0_-1px_--theme(--color-white/6%)]",
                  tooltipStyle
                    ? "rounded-md shadow-md/5 before:rounded-[calc(var(--radius-md)-1px)]"
                    : "rounded-lg shadow-lg/5 before:rounded-[calc(var(--radius-lg)-1px)]",
                  upsertReplayClassName(toast),
                )}
                {...toastData?.rootProps}
                data-slot="toast-popup"
                toast={toast}
              >
                {tooltipStyle ? (
                  <Toast.Content className="pointer-events-auto px-2 py-1">
                    <Toast.Title data-slot="toast-title" />
                  </Toast.Content>
                ) : (
                  <Toast.Content className="pointer-events-auto flex items-center justify-between gap-1.5 overflow-hidden px-3.5 py-3 text-sm">
                    <div className="flex gap-2">
                      {Icon && (
                        <div
                          className="[&>svg]:h-lh [&>svg]:w-4 [&_svg]:pointer-events-none [&_svg]:shrink-0"
                          data-slot="toast-icon"
                        >
                          <Icon className="in-data-[type=loading]:animate-spin in-data-[type=error]:text-destructive in-data-[type=info]:text-info in-data-[type=success]:text-success in-data-[type=warning]:text-warning in-data-[type=loading]:opacity-80" />
                        </div>
                      )}
                      <div className="flex flex-col gap-0.5">
                        <Toast.Title className="font-medium" data-slot="toast-title" />
                        <Toast.Description className="text-muted-foreground" data-slot="toast-description" />
                      </div>
                    </div>
                    {toast.actionProps && (
                      <Toast.Action className={buttonVariants({ size: "xs" })} data-slot="toast-action">
                        {toast.actionProps.children}
                      </Toast.Action>
                    )}
                  </Toast.Content>
                )}
              </Toast.Root>
            </Toast.Positioner>
          );
        })}
      </Toast.Viewport>
    </Toast.Portal>
  );
}
