"use client";

import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { ChevronRightIcon } from "lucide-react";
import type React from "react";
import { cn } from "@/lib/utils";

export function DrawerMenu({
  className,
  render,
  ...props
}: useRender.ComponentProps<"nav">): React.ReactElement {
  const defaultProps = {
    className: cn("-m-2 flex flex-col", className),
    "data-slot": "drawer-menu",
  };
  return useRender({
    defaultTagName: "nav",
    props: mergeProps<"nav">(defaultProps, props),
    render,
  });
}

export function DrawerMenuItem({
  className,
  variant = "default",
  render,
  disabled,
  ...props
}: useRender.ComponentProps<"button"> & {
  variant?: "default" | "destructive";
}): React.ReactElement {
  const defaultProps = {
    className: cn(
      "flex min-h-9 w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1 text-base text-foreground outline-none hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-64 data-[variant=destructive]:text-destructive-foreground sm:min-h-8 sm:text-sm [&>svg:not([class*='opacity-'])]:opacity-80 [&>svg:not([class*='size-'])]:size-4.5 sm:[&>svg:not([class*='size-'])]:size-4 [&>svg]:pointer-events-none [&>svg]:-mx-0.5 [&>svg]:shrink-0",
      className,
    ),
    "data-slot": "drawer-menu-item",
    "data-variant": variant,
    disabled,
    type: "button" as const,
  };
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(defaultProps, props),
    render,
  });
}

export function DrawerMenuSeparator({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn("mx-2 my-1 h-px bg-border", className),
    "data-slot": "drawer-menu-separator",
  };
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function DrawerMenuGroup({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn("flex flex-col", className),
    "data-slot": "drawer-menu-group",
  };
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function DrawerMenuGroupLabel({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn("px-2 py-1.5 font-medium text-muted-foreground text-xs", className),
    "data-slot": "drawer-menu-group-label",
  };
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function DrawerMenuTrigger({
  className,
  children,
  ...props
}: DrawerPrimitive.Trigger.Props): React.ReactElement {
  return (
    <DrawerPrimitive.Trigger
      className={cn(
        "flex min-h-9 w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1 text-base text-foreground outline-none hover:bg-accent hover:text-accent-foreground sm:min-h-8 sm:text-sm [&_svg:not(:last-child)]:-mx-0.5 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      data-slot="drawer-menu-trigger"
      {...props}
    >
      {children}
      <ChevronRightIcon className="ms-auto -me-0.5 opacity-80" />
    </DrawerPrimitive.Trigger>
  );
}
