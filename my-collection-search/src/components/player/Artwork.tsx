"use client";

import React from "react";
import { Box, Image } from "@chakra-ui/react";

const Artwork: React.FC<{ src?: string; alt?: string; size?: string }> = ({
  src,
  alt,
  size = "48px",
}) => {
  if (!src) {
    return <Box width={size} height={size} bg="bg.muted" borderRadius="md" />;
  }

  return (
    <Image
      src={src || "/images/placeholder-artwork.png"}
      alt={alt || "Artwork"}
      boxSize={size}
      objectFit="cover"
      borderRadius="md"
      borderWidth="1px"
    />
  );
};

export default Artwork;
