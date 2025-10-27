"use client";
import React from "react";
import NextLink from "next/link";
import { Link } from "@chakra-ui/react";

export type ArtistLinkProps = {
  artist: string;
  friendId?: number | null;
  stopPropagation?: boolean;
  children?: React.ReactNode;
  className?: string;
};

export default function ArtistLink({
  artist,
  friendId,
  stopPropagation = false,
  children,
  className,
}: ArtistLinkProps) {
  const href = `/albums?q=${encodeURIComponent(artist)}${friendId ? `&friend_id=${friendId}` : ""}`;

  return (
    <Link
      as={NextLink}
      href={href}
      _hover={{ textDecoration: "underline" }}
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation();
      }}
      className={className}
    >
      {children ?? artist}
    </Link>
  );
}
