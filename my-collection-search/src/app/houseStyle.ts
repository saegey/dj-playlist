// The retro house style: square corners, 2px outlines, hard offset shadows
// with no blur, mono labels (#667). Everything that gives the app its shape
// lives in this file, so tuning the look is a one-file change.
//
// Provisional until #664 is signed off.
import { defineRecipe, defineSlotRecipe, type SystemStyleObject } from "@chakra-ui/react";
import {
  cardAnatomy,
  dialogAnatomy,
  drawerAnatomy,
  menuAnatomy,
  nativeSelectAnatomy,
  popoverAnatomy,
  selectAnatomy,
} from "@chakra-ui/react/anatomy";

/** Outline width for controls and containers. */
export const outlineWidth = "2px";
/** Ruled dividers inside a bordered block. */
export const ruleWidth = "1px";

/** Hard offset shadows: x and y offset, no blur, no spread. */
export const shadowOffsets = {
  /** Pressed button. */
  pressed: "1px",
  /** Chips, small controls. */
  xs: "2px",
  /** Compact controls: buttons, inputs, tags. */
  sm: "3px",
  /** Containers: cards, dialogs, menus, lists. */
  md: "6px",
} as const;

const hard = (offset: string) => `${offset} ${offset} 0 0 var(--gn-shadow)`;

export const shadows = {
  xs: { value: hard(shadowOffsets.xs) },
  sm: { value: hard(shadowOffsets.sm) },
  md: { value: hard(shadowOffsets.md) },
  lg: { value: hard(shadowOffsets.md) },
  xl: { value: hard(shadowOffsets.md) },
  "2xl": { value: hard(shadowOffsets.md) },
  // The default inner shadow is blurred; a flat inset keeps the rule.
  inner: { value: `inset ${shadowOffsets.xs} ${shadowOffsets.xs} 0 0 var(--gn-shadow)` },
  pressed: { value: hard(shadowOffsets.pressed) },
};

// Everything is square. `full` stays for round things: slider thumbs,
// avatars, player transport buttons.
const square = { value: "0" };
export const radii = {
  "2xs": square,
  xs: square,
  sm: square,
  md: square,
  lg: square,
  xl: square,
  "2xl": square,
  "3xl": square,
  "4xl": square,
};

export const borderWidths = {
  outline: { value: outlineWidth },
  rule: { value: ruleWidth },
};

// Each token reads a CSS variable so #670 can swap a face without touching
// the theme. `label` falls back to the mono face until a palette or setting
// sets `--gn-font-label`. The fallback stacks match the metrics of the
// loaded fonts closely enough to avoid layout shift while they swap in.
const sansFallback = `"Helvetica Neue", Arial, sans-serif`;
const monoFallback = `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
export const fonts = {
  heading: { value: `var(--gn-font-heading), "Arial Narrow", ${sansFallback}` },
  body: { value: `var(--gn-font-body), ${sansFallback}` },
  mono: { value: `var(--gn-font-mono), ${monoFallback}` },
  label: { value: `var(--gn-font-label, var(--gn-font-mono)), ${monoFallback}` },
};

/** The focus ring every control shares: solid, offset from the 2px border. */
export const focusRing = {
  width: "2px",
  offset: "2px",
  color: "var(--gn-accent-focus-ring)",
} as const;

const motionSafe = "@media (prefers-reduced-motion: no-preference)";

// Pressing shifts a button down and right by the amount its shadow shrinks
// (3px to 1px), so it looks pushed into the page. Nothing moves for reduced
// motion; the darker fill still marks the press.
const buttonShift = "2px";

// Solid and outline buttons are labelled in the mono face; ghost buttons often
// hold content (a playlist's name), so they keep the body face.
const buttonLabel: SystemStyleObject = { fontFamily: "label", fontWeight: "semibold", letterSpacing: "0.02em" };

const solidButton: SystemStyleObject = {
  bg: "colorPalette.solid",
  color: "colorPalette.contrast",
  borderColor: "border.ink",
  boxShadow: "sm",
  _hover: { bg: "colorPalette.solid", filter: "brightness(1.08)" },
  _expanded: { bg: "colorPalette.solid" },
  _active: {
    filter: "brightness(0.94)",
    [motionSafe]: {
      transform: `translate(${buttonShift}, ${buttonShift})`,
      boxShadow: "pressed",
    },
  },
  _disabled: { boxShadow: "none" },
};

const fieldStates = (focus: SystemStyleObject): Record<"outline" | "subtle", SystemStyleObject> => ({
  outline: { borderWidth: "outline", borderColor: "border.ink", bg: "bg.panel", ...focus },
  subtle: { borderWidth: "outline", ...focus },
});
const outsideRing = { focusVisibleRing: "outside" } as const;

export const recipes = {
  button: defineRecipe({
    base: {
      borderWidth: "outline",
      [motionSafe]: {
        transitionProperty: "background-color, color, border-color, box-shadow, transform",
        transitionDuration: "80ms",
      },
    },
    variants: {
      variant: {
        solid: { ...buttonLabel, ...solidButton },
        outline: { ...buttonLabel, borderColor: "colorPalette.border", boxShadow: "none" },
        ghost: { boxShadow: "none" },
      },
    },
  }),
  input: defineRecipe({ variants: { variant: fieldStates(outsideRing) } }),
  textarea: defineRecipe({ variants: { variant: fieldStates(outsideRing) } }),
  // Every badge is a tag: spaced-out mono capitals. Status tags always carry
  // their word, so the type does the work and the fill only adds to it.
  badge: defineRecipe({
    base: {
      fontFamily: "label",
      fontWeight: "medium",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
    variants: {
      variant: {
        subtle: { borderWidth: "rule", borderStyle: "solid", borderColor: "colorPalette.border" },
      },
    },
  }),
};

const container: SystemStyleObject = { borderWidth: "outline", borderColor: "border.ink", boxShadow: "md" };

export const slotRecipes = {
  card: defineSlotRecipe({
    slots: cardAnatomy.keys(),
    variants: {
      variant: { outline: { root: container }, elevated: { root: container }, subtle: { root: container } },
    },
  }),
  dialog: defineSlotRecipe({ slots: dialogAnatomy.keys(), base: { content: container } }),
  drawer: defineSlotRecipe({ slots: drawerAnatomy.keys(), base: { content: container } }),
  popover: defineSlotRecipe({ slots: popoverAnatomy.keys(), base: { content: container } }),
  menu: defineSlotRecipe({ slots: menuAnatomy.keys(), base: { content: container } }),
  select: defineSlotRecipe({
    slots: selectAnatomy.keys(),
    base: { content: container },
    variants: {
      variant: {
        outline: { trigger: fieldStates(outsideRing).outline },
        subtle: { trigger: fieldStates(outsideRing).subtle },
      },
    },
  }),
  nativeSelect: defineSlotRecipe({
    slots: nativeSelectAnatomy.keys(),
    variants: {
      variant: {
        outline: { field: fieldStates(outsideRing).outline },
        subtle: { field: fieldStates(outsideRing).subtle },
      },
    },
  }),
};

// A focus ring for anything the recipes don't reach: plain elements with a
// tabIndex, third-party widgets. Recipes that set their own ring use the same
// width, offset and colour.
export const globalCss: Record<string, SystemStyleObject> = {
  ":focus-visible": {
    outline: `${focusRing.width} solid ${focusRing.color}`,
    outlineOffset: focusRing.offset,
  },
};
