"use client"

import { ChakraProvider } from "@chakra-ui/react"
import {
  ColorModeProvider,
  type ColorModeProviderProps,
} from "./color-mode"
import chakraTheme from "../../app/chakraTheme"

export function Provider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider theme={chakraTheme}>
      <ColorModeProvider {...props} />
    </ChakraProvider>
  )
}
