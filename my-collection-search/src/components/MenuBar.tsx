import NextLink from "next/link";
import { Container, Flex, Group, Link, SimpleGrid, Text } from "@chakra-ui/react";

interface TopMenuBarProps {
  current?: string;
}

const menuItems = [
  { href: "/", label: "Playlists" },
  { href: "/missing-apple-music", label: "Match" },
  { href: "/backfill-audio", label: "Audio" },
  { href: "/bulk-notes", label: "Metadata" },
  { href: "/discogs", label: "Settings" },
];

export default function TopMenuBar({ current }: TopMenuBarProps) {
  return (
    <Flex
      as="nav"
      bgColor={"gray.subtle"}
      color="brand.menuText"
      p="4"
      mb="4"
      // justify="space-around"
    >
      <Container>
        {/* <Text fontSize="lg" fontWeight="bold" hideBelow="md">
          Vinyl Playlist
        </Text> */}
        <Group gap={4} align="center">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            _hover={{ textDecoration: "none", color: "brand.menuHover" }}
            fontWeight={current === item.href ? "bold" : "normal"}
            color={current === item.href ? "brand.menuActiveText" : undefined}
            // borderBottom={current === item.href ? "2px solid" : undefined}
            // borderColor={
            //   current === item.href ? "brand.menuActiveBorder" : undefined
            // }
            px={2}
            as={NextLink}
          >
            {item.label}
          </Link>
        ))}
        </Group>
      </Container>
    </Flex>
  );
}
