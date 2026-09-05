import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Box } from '@chakra-ui/react';
import AlbumTrackItem from '@/components/AlbumTrackItem';
import {
  sampleTrack,
  trackWithAudio,
  trackMinimal,
  trackInPlaylist,
  trackNoEmbeddingNoBpm,
} from './fixtures/track';

const meta: Meta<typeof AlbumTrackItem> = {
  title: 'Components/AlbumTrackItem',
  component: AlbumTrackItem,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <Box maxW="800px" mx="auto" borderWidth="1px" borderRadius="md" overflow="hidden">
        <Story />
      </Box>
    ),
  ],
  args: {
    track: sampleTrack,
    albumArtist: 'Various',
    playlistCount: 0,
  },
};

export default meta;
type Story = StoryObj<typeof AlbumTrackItem>;

export const Default: Story = {
  name: 'Default (same artist as album)',
};

export const WithAudio: Story = {
  name: 'With audio — play button shown on desktop',
  args: { track: trackWithAudio },
};

export const DifferentArtist: Story = {
  name: 'Different artist (compilation track)',
  args: {
    track: sampleTrack,
    albumArtist: 'Some Other Artist',
  },
};

export const WithPlaylistCount: Story = {
  name: 'In playlists',
  args: { playlistCount: 2 },
};

export const WithNotes: Story = {
  name: 'With notes (file text icon)',
  args: { track: trackWithAudio },
};

export const Minimal: Story = {
  name: 'Minimal — no BPM, key, or notes',
  args: { track: trackMinimal },
};

export const FullTracklist: Story = {
  name: 'Full tracklist (multiple items)',
  render: (args) => (
    <Box borderWidth="1px" borderRadius="md" overflow="hidden">
      <AlbumTrackItem {...args} track={{ ...sampleTrack, position: 'A1' }} />
      <AlbumTrackItem {...args} track={{ ...trackWithAudio, position: 'A2' }} />
      <AlbumTrackItem {...args} track={{ ...trackInPlaylist, position: 'A3' }} playlistCount={1} />
      <AlbumTrackItem {...args} track={{ ...trackMinimal, position: 'B1' }} />
      <AlbumTrackItem {...args} track={{ ...trackNoEmbeddingNoBpm, position: 'B2' }} />
    </Box>
  ),
  decorators: [
    (Story) => (
      <Box maxW="800px" mx="auto">
        <Story />
      </Box>
    ),
  ],
};
