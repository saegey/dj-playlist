import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Box } from '@chakra-ui/react';
import TrackResult from '@/components/TrackResult';
import {
  sampleTrack,
  trackWithAudio,
  trackMinimal,
  trackInPlaylist,
  trackNoEmbeddingNoBpm,
} from './fixtures/track';

const meta: Meta<typeof TrackResult> = {
  title: 'Components/TrackResult',
  component: TrackResult,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <Box maxW="1360px" mx="auto">
        <Story />
      </Box>
    ),
  ],
  args: {
    track: sampleTrack,
    showUsername: true,
    showRating: true,
    showDetails: true,
    showGenres: true,
    showNotes: true,
    showPlaylistCount: true,
    layout: 'card',
  },
};

export default meta;
type Story = StoryObj<typeof TrackResult>;

export const Default: Story = {
  name: 'Default (card layout)',
};

export const WithAudio: Story = {
  name: 'With audio — hover artwork to play',
  args: {
    track: trackWithAudio,
  },
};

export const RowLayout: Story = {
  name: 'Row layout (desktop search results)',
  args: {
    layout: 'row',
  },
  decorators: [
    (Story) => (
      <Box maxW="1360px" mx="auto">
        <Story />
      </Box>
    ),
  ],
};

export const RowLayoutWithIssues: Story = {
  name: 'Row layout — missing BPM + embedding',
  args: {
    track: trackNoEmbeddingNoBpm,
    layout: 'row',
  },
  decorators: [
    (Story) => (
      <Box maxW="1360px" mx="auto">
        <Story />
      </Box>
    ),
  ],
};

export const WithTrackGenres: Story = {
  name: 'Track genres (#470)',
  args: {
    track: {
      ...sampleTrack,
      track_genres: [
        { id: 'cumbia', name: 'Cumbia', slug: 'cumbia', parent_id: null, parent_name: null },
        { id: 'chicha', name: 'Chicha', slug: 'chicha', parent_id: 'cumbia', parent_name: 'Cumbia' },
      ],
    },
  },
};

export const WithDiscogsFallback: Story = {
  name: 'Discogs style fallback, unreconciled track (#470)',
  args: {
    track: { ...sampleTrack, track_genres: [], local_tags: '', styles: ['Bossa Nova', 'Latin Jazz'] },
  },
};

export const WithNoGenres: Story = {
  name: 'No genres at all (#470)',
  args: {
    track: { ...sampleTrack, track_genres: [], local_tags: '', styles: [] },
  },
};

export const WithPlaylistCount: Story = {
  name: 'With playlist count badge',
  args: {
    playlistCount: 3,
  },
};

export const Selected: Story = {
  name: 'Selected (checkbox checked)',
  args: {
    isSelected: true,
    onToggleSelect: () => {},
  },
};

export const HiddenUsername: Story = {
  name: 'Username hidden (friend context)',
  args: {
    showUsername: false,
  },
};

export const NoGenres: Story = {
  name: 'No genres / minimal data',
  args: {
    track: trackMinimal,
  },
};

export const SemanticScore: Story = {
  name: 'With AI similarity score',
  args: {
    track: { ...sampleTrack, _semanticScore: 0.93 },
  },
};

export const MultipleInList: Story = {
  name: 'Multiple tracks (card layout)',
  render: (args) => (
    <Box>
      <TrackResult {...args} track={sampleTrack} />
      <TrackResult {...args} track={trackWithAudio} />
      <TrackResult {...args} track={trackInPlaylist} sortPositionChange={{ currentPosition: 3, previousPosition: 1 }} />
      <TrackResult {...args} track={trackNoEmbeddingNoBpm} />
    </Box>
  ),
};

export const MultipleRows: Story = {
  name: 'Multiple tracks (row layout)',
  args: { layout: 'row' },
  decorators: [
    (Story) => (
      <Box maxW="1360px" mx="auto">
        <Story />
      </Box>
    ),
  ],
  render: (args) => (
    <Box borderWidth="1px" borderRadius="md" overflow="hidden">
      <TrackResult {...args} track={sampleTrack} />
      <TrackResult {...args} track={trackWithAudio} />
      <TrackResult {...args} track={trackInPlaylist} />
      <TrackResult {...args} track={trackNoEmbeddingNoBpm} />
    </Box>
  ),
};

export const DenseJobCard: Story = {
  name: 'Dense card — jobs page',
  args: {
    density: 'dense',
    layout: 'card',
    showUsername: false,
    showRating: false,
    showDetails: false,
    showGenres: false,
    showNotes: false,
    showPlaylistCount: false,
    footer: <Box borderTopWidth="1px" pt={2}>Job status and actions</Box>,
    buttons: <button aria-label="Job details">Details</button>,
  },
};

export const DenseQueueRow: Story = {
  name: 'Dense row — queue, clickable with actions',
  args: {
    track: trackWithAudio,
    density: 'dense',
    layout: 'row',
    onRowClick: () => {},
    buttons: <button aria-label="Remove track">Remove</button>,
  },
};

export const DenseSelectedCard: Story = {
  name: 'Dense card — selected with genre badges',
  args: {
    density: 'dense',
    layout: 'card',
    isSelected: true,
    onToggleSelect: () => {},
    track: {
      ...sampleTrack,
      track_genres: [{ id: 'cumbia', name: 'Cumbia', slug: 'cumbia', parent_id: null, parent_name: null }],
      local_tags: 'Psychedelic Cumbia',
    },
  },
};
