"use client";

import React from "react";
import { Box, Flex, Text, Link } from "@chakra-ui/react";
import NextLink from "next/link";

export const menuDivider = (
  <Box
    as="hr"
    my={1}
    borderColor="gray.200"
    _dark={{ borderColor: "gray.700" }}
    borderWidth={0}
    borderTopWidth={1}
  />
);

export const drawerDivider = (
  <Box
    as="hr"
    borderColor="gray.200"
    _dark={{ borderColor: "gray.700" }}
    borderWidth={0}
    borderTopWidth={1}
  />
);

export interface DrawerItemProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  disabled?: boolean;
  color?: string;
}

export function DrawerItem({ icon, label, onClick, href, external, disabled, color }: DrawerItemProps) {
  const inner = (
    <Flex
      align="center"
      gap={4}
      px={5}
      py={3.5}
      w="full"
      color={color}
      opacity={disabled ? 0.4 : 1}
      _hover={disabled ? undefined : { bg: "bg.subtle" }}
    >
      <Box flexShrink={0} fontSize="md">{icon}</Box>
      <Text fontSize="md">{label}</Text>
    </Flex>
  );

  if (href && !disabled) {
    if (external) {
      return (
        <Link href={href} target="_blank" rel="noopener noreferrer" display="block" _hover={{ textDecoration: "none" }}>
          {inner}
        </Link>
      );
    }
    return (
      <Link as={NextLink} href={href} display="block" _hover={{ textDecoration: "none" }}>
        {inner}
      </Link>
    );
  }

  return (
    <Box
      as="button"
      onClick={disabled ? undefined : onClick}
      w="full"
      textAlign="left"
      cursor={disabled ? "not-allowed" : "pointer"}
    >
      {inner}
    </Box>
  );
}

export function DrawerSectionLabel({ label }: { label: string }) {
  return (
    <Flex px={5} pt={3} pb={1}>
      <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
        {label}
      </Text>
    </Flex>
  );
}
