"use client";

import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { XIcon } from "lucide-react";
import type React from "react";
import { useContext } from "react";
import { Button } from "@/components/ui/button";
import { DrawerContext, type DrawerPosition } from "@/components/ui/drawer-context";
import { DrawerBar } from "@/components/ui/drawer-sections";
import { cn } from "@/lib/utils";

export function DrawerBackdrop({
  className,
  ...props
}: DrawerPrimitive.Backdrop.Props): React.ReactElement {
  return (
    <DrawerPrimitive.Backdrop
      className={cn(
        "fixed inset-0 z-50 bg-black/32 opacity-[calc(1-var(--drawer-swipe-progress))] backdrop-blur-sm transition-opacity duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-swiping:duration-0 supports-[-webkit-touch-callout:none]:absolute",
        className,
      )}
      data-slot="drawer-backdrop"
      {...props}
    />
  );
}

export function DrawerViewport({
  className,
  position,
  variant = "default",
  ...props
}: DrawerPrimitive.Viewport.Props & {
  position?: DrawerPosition;
  variant?: "default" | "straight" | "inset";
}): React.ReactElement {
  return (
    <DrawerPrimitive.Viewport
      className={cn(
        "fixed inset-0 z-50 touch-none [--bleed:--spacing(12)] [--inset:0px]",
        position === "bottom" &&
          "grid grid-rows-[1fr_auto] pt-[max(--spacing(2),env(safe-area-inset-top,0px))] after:pointer-events-none after:fixed after:inset-x-0 after:bottom-0 after:h-(--bleed) after:bg-popover data-closed:after:opacity-0 has-[[data-swiping]]:after:opacity-0",
        position === "top" && "grid grid-rows-[auto_1fr] pb-12",
        position === "left" && "flex justify-start",
        position === "right" && "flex justify-end",
        variant === "inset" && "px-(--inset) sm:[--inset:--spacing(4)]",
        variant === "inset" && position !== "bottom" && "pt-(--inset)",
        variant === "inset" && position !== "top" && "pb-(--inset)",
        variant === "inset" && position === "bottom" && "sm:after:hidden",
        className,
      )}
      data-slot="drawer-viewport"
      {...props}
    />
  );
}

const POPUP_BASE =
  "relative flex max-h-full min-h-0 w-full min-w-0 flex-col touch-none bg-popover not-dark:bg-clip-padding text-popover-foreground shadow-lg/5 outline-none transition-[transform,box-shadow,height,background-color] duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform [--peek:calc(--spacing(6)-1px)] [--scale-base:calc(max(0,1-(var(--nested-drawers)*var(--stack-step))))] [--scale:clamp(0,calc(var(--scale-base)+(var(--stack-step)*var(--stack-progress))),1)] [--shrink:calc(1-var(--scale))] [--stack-peek-offset:max(0px,calc((var(--nested-drawers)-var(--stack-progress))*var(--peek)))] [--stack-progress:clamp(0,var(--drawer-swipe-progress),1)] [--stack-step:0.05] before:pointer-events-none before:absolute before:inset-0 before:shadow-[0_1px_--theme(--color-black/4%)] after:pointer-events-none after:absolute after:bg-popover data-swiping:select-none data-nested-drawer-open:overflow-hidden data-nested-drawer-open:bg-[color-mix(in_srgb,var(--popover),var(--color-black)_calc(2%*(var(--nested-drawers)-var(--stack-progress))))] data-ending-style:shadow-transparent data-starting-style:shadow-transparent data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] dark:data-nested-drawer-open:bg-[color-mix(in_srgb,var(--popover),var(--color-black)_calc(6%*(var(--nested-drawers)-var(--stack-progress))))] dark:before:shadow-[0_-1px_--theme(--color-white/6%)]";

export function DrawerPopup({
  className,
  children,
  showCloseButton = false,
  position: positionProp,
  variant = "default",
  showBar = false,
  portalProps,
  ...props
}: DrawerPrimitive.Popup.Props & {
  showCloseButton?: boolean;
  position?: DrawerPosition;
  variant?: "default" | "straight" | "inset";
  showBar?: boolean;
  portalProps?: DrawerPrimitive.Portal.Props;
}): React.ReactElement {
  const { position: contextPosition } = useContext(DrawerContext);
  const position = positionProp ?? contextPosition;

  const popup = (
    <DrawerPrimitive.Portal {...portalProps}>
      <DrawerBackdrop />
      <DrawerViewport position={position} variant={variant}>
        <DrawerPrimitive.Popup
          className={cn(
            POPUP_BASE,
            position === "bottom" &&
              "z-1 transform-[translateY(calc(var(--keyboard-snap-offset)+var(--drawer-swipe-movement-y)))] data-ending-style:transform-[translateY(calc(100%+env(safe-area-inset-bottom,0px)+var(--inset)))] data-starting-style:transform-[translateY(calc(100%+env(safe-area-inset-bottom,0px)+var(--inset)))] row-start-2 -mb-[max(0px,calc(var(--keyboard-snap-offset)+clamp(0,1,var(--keyboard-snap-offset)/1px)*var(--drawer-swipe-movement-y,0px)))] border-t pb-[max(0px,calc(max(env(safe-area-inset-bottom,0px),var(--drawer-keyboard-inset,0px))+var(--keyboard-snap-offset)+clamp(0,1,var(--keyboard-snap-offset)/1px)*var(--drawer-swipe-movement-y,0px)))] not-data-starting-style:not-data-ending-style:transition-[transform,box-shadow,height,background-color,margin,padding] [--keyboard-snap-offset:max(0px,calc(var(--drawer-snap-point-offset,0px)-var(--drawer-keyboard-inset,0px)))] after:inset-x-0 after:top-full after:h-(--bleed) has-data-[slot=drawer-bar]:pt-2 data-ending-style:mb-0 data-starting-style:mb-0 data-ending-style:pb-0 data-starting-style:pb-0 data-nested-drawer-open:transform-[translateY(calc(var(--drawer-swipe-movement-y)-var(--stack-peek-offset)-(var(--shrink)*var(--height))))_scale(var(--scale))] origin-[50%_calc(100%-var(--inset))]",
            position === "top" &&
              "data-starting-style:transform-[translateY(calc(-100%-var(--inset)))] data-ending-style:transform-[translateY(calc(-100%-var(--inset)))] transform-[translateY(var(--drawer-swipe-movement-y))] border-b after:inset-x-0 after:bottom-full after:h-(--bleed) has-data-[slot=drawer-bar]:pb-2 data-nested-drawer-open:transform-[translateY(calc(var(--drawer-swipe-movement-y)+var(--stack-peek-offset)+(var(--shrink)*var(--height))))_scale(var(--scale))] origin-[50%_var(--inset)]",
            position === "left" &&
              "data-starting-style:transform-[translateX(calc(-100%-var(--inset)))] data-ending-style:transform-[translateX(calc(-100%-var(--inset)))] transform-[translateX(var(--drawer-swipe-movement-x))] w-[calc(100%-(--spacing(12)))] max-w-md border-e after:inset-y-0 after:end-full after:w-(--bleed) has-data-[slot=drawer-bar]:pe-2 data-nested-drawer-open:transform-[translateX(calc(var(--drawer-swipe-movement-x)+var(--stack-peek-offset)))_scale(var(--scale))] origin-right",
            position === "right" &&
              "transform-[translateX(var(--drawer-swipe-movement-x))] data-ending-style:transform-[translateX(calc(100%+var(--inset)))] data-starting-style:transform-[translateX(calc(100%+var(--inset)))] col-start-2 w-[calc(100%-(--spacing(12)))] max-w-md border-s after:inset-y-0 after:start-full after:w-(--bleed) has-data-[slot=drawer-bar]:ps-2 data-nested-drawer-open:transform-[translateX(calc(var(--drawer-swipe-movement-x)-var(--stack-peek-offset)))_scale(var(--scale))] origin-left",
            (position === "bottom" || position === "top") &&
              "h-(--drawer-height,auto) [--height:max(0px,calc(var(--drawer-frontmost-height,var(--drawer-height))))] data-nested-drawer-open:h-(--height)",
            variant !== "straight" &&
              cn(
                position === "bottom" && "rounded-t-2xl before:rounded-t-[calc(var(--radius-2xl)-1px)]",
                position === "top" &&
                  "rounded-b-2xl before:rounded-b-[calc(var(--radius-2xl)-1px)] **:data-[slot=drawer-footer]:rounded-b-[calc(var(--radius-2xl)-1px)]",
                position === "left" &&
                  "rounded-e-2xl before:rounded-e-[calc(var(--radius-2xl)-1px)] **:data-[slot=drawer-footer]:rounded-ee-[calc(var(--radius-2xl)-1px)]",
                position === "right" &&
                  "rounded-s-2xl before:rounded-s-[calc(var(--radius-2xl)-1px)] **:data-[slot=drawer-footer]:rounded-es-[calc(var(--radius-2xl)-1px)]",
              ),
            variant === "inset" &&
              "before:hidden sm:rounded-2xl sm:border sm:after:bg-transparent sm:before:rounded-[calc(var(--radius-2xl)-1px)] sm:**:data-[slot=drawer-footer]:rounded-b-[calc(var(--radius-2xl)-1px)]",
            variant === "straight" && "[--stack-step:0]",
            className,
          )}
          data-slot="drawer-popup"
          {...props}
        >
          {children}
          {showCloseButton && (
            <DrawerPrimitive.Close
              aria-label="Close"
              className="absolute end-2 top-2 z-1"
              render={<Button size="icon" variant="ghost" />}
            >
              <XIcon />
            </DrawerPrimitive.Close>
          )}
          {showBar && <DrawerBar />}
        </DrawerPrimitive.Popup>
      </DrawerViewport>
    </DrawerPrimitive.Portal>
  );

  return position === "bottom" ? (
    <DrawerPrimitive.VirtualKeyboardProvider>{popup}</DrawerPrimitive.VirtualKeyboardProvider>
  ) : (
    popup
  );
}
