import NextLink from "next/link";
import { Flex, Link } from "@chakra-ui/react";

interface TopMenuBarProps {
  current?: string;
}

const menuItems = [
  { href: "/", label: "Playlists" },
    { href: "/missing-apple-music", label: "Match" },
  { href: "/backfill-audio", label: "Audio" },
  { href: "/bulk-notes", label: "Metadata" },
  { href: "/discogs", label: "Settings" }
];

export default function TopMenuBar({ current }: TopMenuBarProps) {
  return (
    <Flex as="nav" bg="brand.menuBg" color="brand.menuText" p="4" justify="space-around">
      {menuItems.map((item) => (
        <NextLink key={item.href} href={item.href} passHref legacyBehavior>
          <Link
            _hover={{ textDecoration: "none", color: "brand.menuHover" }}
            fontWeight={current === item.href ? "bold" : "normal"}
            color={current === item.href ? "brand.menuActiveText" : undefined}
            borderBottom={current === item.href ? "2px solid" : undefined}
            borderColor={current === item.href ? "brand.menuActiveBorder" : undefined}
            px={2}
          >
            {item.label}
          </Link>
        </NextLink>
      ))}
    </Flex>
  );
}
