"use client";

import React, { useState, useEffect } from "react";
import {
  Button,
  HStack,
  Icon,
  Text,
} from "@chakra-ui/react";
import { Tooltip } from "@/components/ui/tooltip";
import { FiHeadphones, FiSpeaker } from "react-icons/fi";

export type PlaybackMode = 'browser' | 'local-dac';

interface PlaybackModeSelectorProps {
  value: PlaybackMode;
  onChange: (mode: PlaybackMode) => void;
  disabled?: boolean;
  compact?: boolean;
}

/**
 * PlaybackModeSelector - Toggle between browser playback and local DAC playback
 *
 * Browser mode: Audio plays through the web browser (HTML5 audio element)
 * Local DAC mode: Audio plays through the server's USB DAC via ALSA
 */
export default function PlaybackModeSelector({
  value,
  onChange,
  disabled = false,
  compact = false,
}: PlaybackModeSelectorProps) {
  const [isLocalAvailable, setIsLocalAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check if local playback is available on mount
  useEffect(() => {
    async function checkLocalPlayback() {
      try {
        const res = await fetch('/api/playback/test');
        const data = await res.json();
        setIsLocalAvailable(data.available);
      } catch (error) {
        console.error('Failed to check local playback availability:', error);
        setIsLocalAvailable(false);
      } finally {
        setIsChecking(false);
      }
    }

    checkLocalPlayback();
  }, []);

  if (isChecking) {
    return null; // Don't show while checking
  }

  if (!isLocalAvailable) {
    // Only show browser mode if local DAC is not available
    return null;
  }

  return (
    <HStack gap={compact ? 1 : 2}>
      {!compact && (
        <Text fontSize="xs" color="fg.muted" display={{ base: 'none', md: 'block' }}>
          Output:
        </Text>
      )}

      <HStack gap={1} bg="bg.muted" borderRadius="md" p={1}>
        <Tooltip content="Play through web browser">
          <Button
            size={compact ? 'xs' : 'sm'}
            variant="ghost"
            bg={value === 'browser' ? 'bg.emphasized' : 'transparent'}
            _hover={{ bg: value === 'browser' ? 'bg.emphasized' : 'bg.subtle' }}
            onClick={() => onChange('browser')}
            disabled={disabled}
          >
            <Icon as={FiHeadphones} />
            {/* Show text on md+ screens, hide on mobile */}
            {!compact && <span style={{ marginLeft: '0.5rem' }}>Browser</span>}
          </Button>
        </Tooltip>

        <Tooltip content="Play through USB DAC (server-side audio)">
          <Button
            size={compact ? 'xs' : 'sm'}
            variant="ghost"
            bg={value === 'local-dac' ? 'bg.emphasized' : 'transparent'}
            _hover={{ bg: value === 'local-dac' ? 'bg.emphasized' : 'bg.subtle' }}
            onClick={() => onChange('local-dac')}
            disabled={disabled}
          >
            <Icon as={FiSpeaker} />
            {/* Show text on md+ screens, hide on mobile */}
            {!compact && <span style={{ marginLeft: '0.5rem' }}>DAC</span>}
          </Button>
        </Tooltip>
      </HStack>
    </HStack>
  );
}
