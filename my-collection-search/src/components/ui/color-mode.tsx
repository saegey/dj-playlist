"use client";

import type { IconButtonProps } from "@chakra-ui/react";
import { IconButton } from "@chakra-ui/react";
import { ThemeProvider, useTheme } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import * as React from "react";
import { LuMoon, LuSun } from "react-icons/lu";

export function ColorModeProvider(props: ThemeProviderProps) {
  return (
    <ThemeProvider attribute="class" disableTransitionOnChange {...props} />
  );
}

export type ColorMode = "light" | "dark";

export interface UseColorModeReturn {
  colorMode: ColorMode;
  setColorMode: (colorMode: ColorMode) => void;
  toggleColorMode: () => void;
}

export function useColorMode(): UseColorModeReturn {
  const { resolvedTheme, setTheme, forcedTheme } = useTheme();
  const colorMode = forcedTheme || resolvedTheme;
  const toggleColorMode = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };
  return {
    colorMode: colorMode as ColorMode,
    setColorMode: setTheme,
    toggleColorMode,
  };
}

export function useColorModeValue<T>(light: T, dark: T) {
  const { colorMode } = useColorMode();
  return colorMode === "dark" ? dark : light;
}

export function ColorModeIcon() {
  const { colorMode } = useColorMode();
  return colorMode === "dark" ? <LuMoon /> : <LuSun />;
}

type ColorModeButtonProps = Omit<IconButtonProps, "aria-label">

export const ColorModeButton = React.forwardRef<
  HTMLButtonElement,
  ColorModeButtonProps
>(function ColorModeButton(props, ref) {
  const { toggleColorMode } = useColorMode();
  return (
    // <ClientOnly fallback={<Skeleton boxSize="8" />}>
    <IconButton
      onClick={toggleColorMode}
      variant="ghost"
      aria-label="Toggle color mode"
      size="sm"
      ref={ref}
      {...props}
      css={{
        _icon: {
          width: "5",
          height: "5",
        },
      }}
    >
      <ColorModeIcon />
    </IconButton>
    // </ClientOnly>
  );
});

import { forwardRef, HTMLAttributes } from "react";

export const LightMode = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  function LightMode({ className, ...rest }, ref) {
    return (
      <span
        className={`chakra-theme light${className ? ` ${className}` : ""}`}
        ref={ref}
        {...rest}
      />
    );
  }
);

export const DarkMode = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  function DarkMode({ className, ...rest }, ref) {
    return (
      <span
        className={`chakra-theme dark${className ? ` ${className}` : ""}`}
        ref={ref}
        {...rest}
      />
    );
  }
);
