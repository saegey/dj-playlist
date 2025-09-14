"use client";

import React from "react";
import { Flex, Container } from "@chakra-ui/react";

import SearchResults from "@/components/SearchResults";

const SearchPage = () => {
  return (
    <>
      <Flex gap={4} direction="row">
        {/* Search Results */}
        <Container maxW={["8xl", "2xl", "2xl"]} pt={3}>
          <SearchResults />
        </Container>
      </Flex>
    </>
  );
};

const SearchPageWrapper = () => {
  return <SearchPage />;
};
export default SearchPageWrapper;
