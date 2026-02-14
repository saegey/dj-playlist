"use client";

import React, { useState } from "react";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { useServerInsertedHTML } from "next/navigation";

type Props = {
  children: React.ReactNode;
};

export default function EmotionRegistry({ children }: Props) {
  const [cache] = useState(() => {
    const cache = createCache({ key: "chakra" });
    cache.compat = true;
    return cache;
  });

  useServerInsertedHTML(() => {
    const inserted = Object.keys(cache.inserted);
    if (inserted.length === 0) return null;
    const styles = Object.values(cache.inserted).join(" ");
    return (
      <style
        data-emotion={`${cache.key} ${inserted.join(" ")}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
