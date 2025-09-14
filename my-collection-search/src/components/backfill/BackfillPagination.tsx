"use client";

import React from "react";
import { ButtonGroup, IconButton, Pagination, Stack } from "@chakra-ui/react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

type Props = {
  total: number;
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
};

export default function BackfillPagination({ total, page, pageSize, setPage }: Props) {
  return (
    <Stack align="center" my={4}>
      <Pagination.Root count={total} pageSize={pageSize} page={page}>
        <ButtonGroup variant="ghost" size="md">
          <Pagination.PrevTrigger asChild>
            <IconButton aria-label="Previous page" onClick={() => setPage(Math.max(page - 1, 1))}>
              <LuChevronLeft />
            </IconButton>
          </Pagination.PrevTrigger>
          <Pagination.Items
            render={(pageObj: { type: "page"; value: number }) => (
              <IconButton
                key={pageObj.value}
                variant={pageObj.value === page ? "solid" : "outline"}
                aria-current={pageObj.value === page ? "page" : undefined}
                onClick={() => setPage(pageObj.value)}
              >
                {pageObj.value}
              </IconButton>
            )}
          />
          <Pagination.NextTrigger asChild>
            <IconButton aria-label="Next page" onClick={() => setPage(page + 1)}>
              <LuChevronRight />
            </IconButton>
          </Pagination.NextTrigger>
        </ButtonGroup>
      </Pagination.Root>
    </Stack>
  );
}
