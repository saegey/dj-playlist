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
    <Flex as="nav" bg="gray.800" color="white" p="4" justify="space-around">
      {menuItems.map((item) => (
        <NextLink key={item.href} href={item.href} passHref legacyBehavior>
          <Link
            _hover={{ textDecoration: "none", color: "gray.300" }}
            fontWeight={current === item.href ? "bold" : "normal"}
            color={current === item.href ? "yellow.300" : undefined}
            borderBottom={
              current === item.href ? "2px solid #ECC94B" : undefined
            }
            px={2}
          >
            {item.label}
          </Link>
        </NextLink>
      ))}
    </Flex>
  );
}
