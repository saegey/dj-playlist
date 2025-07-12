
import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import {
  Box,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Divider,
  VStack,
  Stack,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Container,
} from '@chakra-ui/react';

export const dynamic = 'force-dynamic';

async function getLocalReleasesByUser() {
  const dir = path.resolve(process.cwd(), 'discogs_exports');
  const grouped: Record<string, any[]> = {};
  if (fs.existsSync(dir)) {
    const manifestFiles = fs.readdirSync(dir).filter(f => f.startsWith('manifest_') && f.endsWith('.json'));
    console.log('[Discogs Debug] Found manifest files:', manifestFiles);
    for (const manifestFile of manifestFiles) {
      const manifest = JSON.parse(fs.readFileSync(path.join(dir, manifestFile), 'utf-8'));
      const username = manifest.username || manifestFile.replace(/^manifest_|\.json$/g, '');
      const releaseFiles = manifest.releaseIds || [];
      console.log(`[Discogs Debug] Manifest for user '${username}' has releases:`, releaseFiles);
      for (const releaseFile of releaseFiles) {
        const releasePath = path.join(dir, `release_${releaseFile}.json`);
        if (!fs.existsSync(releasePath)) {
          console.log(`[Discogs Debug] Release file missing:`, releaseFile);
          continue;
        }
        try {
          const data = JSON.parse(fs.readFileSync(releasePath, 'utf-8'));
          const release = {
            id: data.id,
            title: data.title,
            year: data.year,
            artists: data.artists,
            labels: data.labels,
            username
          };
          if (!grouped[username]) grouped[username] = [];
          grouped[username].push(release);
        } catch (e) {
          console.log(`[Discogs Debug] Failed to parse release file:`, releaseFile, e);
        }
      }
    }
  } else {
    console.log('[Discogs Debug] discogs_exports directory does not exist:', dir);
  }
  console.log('[Discogs Debug] Final grouped result:', grouped);
  return grouped;
}

export default async function DiscogsLocalReleasesPage() {
  const grouped = await getLocalReleasesByUser();
  const usernames = Object.keys(grouped);
  if (!usernames.length) {
    return (
      <Container maxW="2xl" py={12}>
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>No Local Discogs Releases Found</AlertTitle>
            <AlertDescription>
              No manifest files or releases were found in <b>discogs_exports</b>.
            </AlertDescription>
          </Box>
        </Alert>
      </Container>
    );
  }
  return (
    <Container maxW="4xl" py={12}>
      <VStack align="stretch" spacing={8}>
        <Box>
          <Heading as="h1" size="xl" mb={2}>Local Discogs Releases</Heading>
          <Text color={'gray.600'}>
            Total users: <b>{usernames.length}</b>
          </Text>
        </Box>
        <Divider />
        {usernames.map(username => (
          <Box key={username} mb={8}>
            <Heading as="h2" size="md" mb={1}>User: {username}</Heading>
            <Text mb={2} color={'gray.500'}>
              Releases: <b>{grouped[username].length}</b>
            </Text>
            <Table variant="simple" size="sm" bg={'white'} borderRadius="md" boxShadow="sm">
              <Thead>
                <Tr>
                  <Th>Release ID</Th>
                  <Th>Artist</Th>
                  <Th>Title</Th>
                  <Th>Year</Th>
                  <Th>Label</Th>
                </Tr>
              </Thead>
              <Tbody>
                {grouped[username].map((r: any) => (
                  <Tr key={r.id || r.title}>
                    <Td>{r.id}</Td>
                    <Td>{r.artists && r.artists.map((a: any) => a.name).join(', ')}</Td>
                    <Td>{r.title}</Td>
                    <Td>{r.year}</Td>
                    <Td>{r.labels && r.labels.map((l: any) => l.name).join(', ')}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        ))}
      </VStack>
    </Container>
  );
}
