"use client";

import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import type React from "react";
import { useContext } from "react";
import {
  DrawerContext,
  drawerDirectionMap,
  type DrawerPosition,
} from "@/components/ui/drawer-context";
import { cn } from "@/lib/utils";

export {
  DrawerMenu,
  DrawerMenuGroup,
  DrawerMenuGroupLabel,
  DrawerMenuItem,
  DrawerMenuSeparator,
  DrawerMenuTrigger,
} from "@/components/ui/drawer-menu";
export {
  DrawerMenuCheckboxItem,
  DrawerMenuRadioGroup,
  DrawerMenuRadioItem,
} from "@/components/ui/drawer-menu-choices";
export { DrawerBackdrop, DrawerPopup, DrawerViewport } from "@/components/ui/drawer-popup";
export {
  DrawerBar,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerTitle,
} from "@/components/ui/drawer-sections";

export const DrawerCreateHandle: typeof DrawerPrimitive.createHandle =
  DrawerPrimitive.createHandle;

export const DrawerPortal: typeof DrawerPrimitive.Portal = DrawerPrimitive.Portal;

export function Drawer({
  swipeDirection,
  position = "bottom",
  ...props
}: DrawerPrimitive.Root.Props & { position?: DrawerPosition }): React.ReactElement {
  return (
    <DrawerContext.Provider value={{ position }}>
      <DrawerPrimitive.Root
        swipeDirection={swipeDirection ?? drawerDirectionMap[position]}
        {...props}
      />
    </DrawerContext.Provider>
  );
}

export function DrawerTrigger(props: DrawerPrimitive.Trigger.Props): React.ReactElement {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

export function DrawerClose(props: DrawerPrimitive.Close.Props): React.ReactElement {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

export function DrawerSwipeArea({
  className,
  position: positionProp,
  ...props
}: DrawerPrimitive.SwipeArea.Props & { position?: DrawerPosition }): React.ReactElement {
  const { position: contextPosition } = useContext(DrawerContext);
  const position = positionProp ?? contextPosition;

  return (
    <DrawerPrimitive.SwipeArea
      className={cn(
        "fixed z-50 touch-none",
        position === "bottom" && "inset-x-0 bottom-0 h-8",
        position === "top" && "inset-x-0 top-0 h-8",
        position === "left" && "inset-y-0 left-0 w-8",
        position === "right" && "inset-y-0 right-0 w-8",
        className,
      )}
      data-slot="drawer-swipe-area"
      {...props}
    />
  );
}

export { DrawerPrimitive };
