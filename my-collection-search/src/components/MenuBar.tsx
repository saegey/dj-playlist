import NextLink from "next/link";
import { Box, Container, Flex, Group, Link, Text } from "@chakra-ui/react";
import { TbPlaylist } from "react-icons/tb";
import { SiApplemusic } from "react-icons/si";
import { LuAudioLines } from "react-icons/lu";
import { IoBookSharp } from "react-icons/io5";
import { IoMdSettings } from "react-icons/io";

interface TopMenuBarProps {
  current?: string;
}

const menuItems = [
  { href: "/", label: "Playlists" },
  { href: "/missing-apple-music", label: "Match" },
  { href: "/backfill-audio", label: "Audio" },
  { href: "/bulk-notes", label: "Metadata" },
  { href: "/settings", label: "Settings" },
];

export default function TopMenuBar({ current }: TopMenuBarProps) {
  return (
    <Flex
      as="nav"
      bgColor={"gray.subtle"}
      color="brand.menuText"
      p="4"
      mb="4"
      justify="center"
    >
      <Container>
        <Group gap={4} align="center" justify="center" grow>
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              _hover={{ textDecoration: "none", color: "brand.menuHover" }}
              fontWeight={current === item.href ? "bold" : "normal"}
              fontSize={["sm", "sm", "sm"]}
              color={current === item.href ? "brand.menuActiveText" : undefined}
              px={2}
              as={NextLink}
            >
              <Flex width={"100%"} justifyContent={"center"} verticalAlign={"center"} gap={2}>
                {item.href === "/" && (
                  <Box>
                    <TbPlaylist
                      size={25}
                      color={
                        current === item.href ? "blue" : "brand.menuActiveText"
                      }
                    />
                  </Box>
                )}
                {item.href === "/missing-apple-music" && (
                  <Box>
                    <SiApplemusic
                      size={25}
                      color={
                        current === item.href ? "blue" : "brand.menuActiveText"
                      }
                    />
                  </Box>
                )}
                {item.href === "/backfill-audio" && (
                  <Box>
                    <LuAudioLines
                      size={25}
                      color={
                        current === item.href ? "blue" : "brand.menuActiveText"
                      }
                    />
                  </Box>
                )}
                {item.href === "/bulk-notes" && (
                  <Box>
                    <IoBookSharp
                      size={25}
                      color={
                        current === item.href ? "blue" : "brand.menuActiveText"
                      }
                    />
                  </Box>
                )}

                {item.href === "/settings" && (
                  <Box>
                    <IoMdSettings
                      size={25}
                      color={
                        current === item.href ? "blue" : "brand.menuActiveText"
                      }
                    />
                  </Box>
                )}
                <Text hideBelow="md" as={"div"}>{item.label}</Text>
              </Flex>
            </Link>
          ))}
        </Group>
      </Container>
    </Flex>
  );
}
