import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Box } from '@chakra-ui/react';
import TrackResultCompact from '@/components/TrackResultCompact';
import {
  sampleTrack,
  trackWithAudio,
  trackMinimal,
  trackInPlaylist,
} from './fixtures/track';

const meta: Meta<typeof TrackResultCompact> = {
  title: 'Components/TrackResultCompact',
  component: TrackResultCompact,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <Box maxW="800px" mx="auto">
        <Story />
      </Box>
    ),
  ],
  args: {
    track: sampleTrack,
    variant: 'card',
    showUsername: true,
    showRating: true,
    showDetails: true,
    showGenres: true,
    showLinks: true,
    showNotes: true,
    showPlaylistCount: true,
  },
};

export default meta;
type Story = StoryObj<typeof TrackResultCompact>;

export const Default: Story = {
  name: 'Card (default)',
};

export const WithAudio: Story = {
  name: 'Card — with audio (hover artwork)',
  args: { track: trackWithAudio },
};

export const RowVariant: Story = {
  name: 'Row variant',
  args: {
    track: sampleTrack,
    variant: 'row',
  },
  decorators: [
    (Story) => (
      <Box maxW="800px" mx="auto" bg="gray.900" borderRadius="md" p={4}>
        <Story />
      </Box>
    ),
  ],
};

export const RowWithAudio: Story = {
  name: 'Row variant — with audio',
  args: {
    track: trackWithAudio,
    variant: 'row',
  },
  decorators: [
    (Story) => (
      <Box maxW="800px" mx="auto" bg="gray.900" borderRadius="md" p={4}>
        <Story />
      </Box>
    ),
  ],
};

export const WithPlaylistCount: Story = {
  name: 'Card — with playlist count',
  args: { track: sampleTrack, playlistCount: 3 },
};

export const Selected: Story = {
  name: 'Card — selected',
  args: { isSelected: true, onToggleSelect: () => {} },
};

export const NoLinks: Story = {
  name: 'Card — links hidden',
  args: { showLinks: false },
};

export const MinimalData: Story = {
  name: 'Card — minimal data',
  args: { track: trackMinimal },
};

export const MultipleCards: Story = {
  name: 'Multiple cards (list)',
  render: (args) => (
    <Box>
      <TrackResultCompact {...args} track={sampleTrack} />
      <TrackResultCompact {...args} track={trackWithAudio} />
      <TrackResultCompact {...args} track={trackInPlaylist} />
      <TrackResultCompact {...args} track={trackMinimal} />
    </Box>
  ),
};

export const MultipleRows: Story = {
  name: 'Multiple rows',
  args: { variant: 'row' },
  decorators: [
    (Story) => (
      <Box maxW="800px" mx="auto" bg="gray.900" borderRadius="md" p={4}>
        <Story />
      </Box>
    ),
  ],
  render: (args) => (
    <Box bg="gray.900" borderRadius="md" p={4}>
      <TrackResultCompact {...args} track={sampleTrack} />
      <TrackResultCompact {...args} track={trackWithAudio} />
      <TrackResultCompact {...args} track={trackInPlaylist} />
      <TrackResultCompact {...args} track={trackMinimal} />
    </Box>
  ),
};
