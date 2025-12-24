"use client";

import React, { useState, useEffect } from "react";
import {
  Button,
  HStack,
  Icon,
  Text,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";
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

  const selectedBg = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.100', 'gray.600');

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
        <Tooltip label="Play through web browser">
          <Button
            size={compact ? 'xs' : 'sm'}
            variant="ghost"
            bg={value === 'browser' ? selectedBg : 'transparent'}
            _hover={{ bg: value === 'browser' ? selectedBg : hoverBg }}
            onClick={() => onChange('browser')}
            disabled={disabled}
            leftIcon={<Icon as={FiHeadphones} />}
          >
            {!compact && 'Browser'}
          </Button>
        </Tooltip>

        <Tooltip label="Play through USB DAC (server-side audio)">
          <Button
            size={compact ? 'xs' : 'sm'}
            variant="ghost"
            bg={value === 'local-dac' ? selectedBg : 'transparent'}
            _hover={{ bg: value === 'local-dac' ? selectedBg : hoverBg }}
            onClick={() => onChange('local-dac')}
            disabled={disabled}
            leftIcon={<Icon as={FiSpeaker} />}
          >
            {!compact && 'DAC'}
          </Button>
        </Tooltip>
      </HStack>
    </HStack>
  );
}
