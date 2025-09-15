"use client";

import React, { Suspense } from "react";
import { Flex, Container, Spinner } from "@chakra-ui/react";

import SearchResults from "@/components/SearchResults";

const SearchPage = () => {
  return (
    <>
      <Flex gap={4} direction="row">
        {/* Search Results */}
        <Container maxW={["8xl", "2xl", "2xl"]} pt={3}>
          <Suspense
            fallback={
              <Flex justify="center" pt={6}>
                <Spinner />
              </Flex>
            }
          >
            <SearchResults />
          </Suspense>
        </Container>
      </Flex>
    </>
  );
};

const SearchPageWrapper = () => {
  return <SearchPage />;
};
export default SearchPageWrapper;
