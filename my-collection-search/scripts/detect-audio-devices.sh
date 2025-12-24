#!/bin/bash

# Audio Device Detection Script
# This script helps identify available audio devices for USB DAC configuration
# Run this on your host machine (not in a container) to find device paths

echo "=================================="
echo "Audio Device Detection Script"
echo "=================================="
echo ""

# Check if running as root or with appropriate permissions
if [ ! -r /dev/snd ] 2>/dev/null; then
    echo "Warning: Unable to read /dev/snd. You may need to run with sudo or add your user to the 'audio' group."
    echo ""
fi

# 1. List all sound devices in /dev/snd
echo "1. Available /dev/snd devices:"
echo "--------------------------------"
if [ -d /dev/snd ]; then
    ls -la /dev/snd/
    echo ""
else
    echo "No /dev/snd directory found. Audio devices may not be available."
    echo ""
fi

# 2. Show ALSA card information
echo "2. ALSA Sound Cards (from /proc/asound/cards):"
echo "------------------------------------------------"
if [ -f /proc/asound/cards ]; then
    cat /proc/asound/cards
    echo ""
else
    echo "Unable to read /proc/asound/cards"
    echo ""
fi

# 3. List PCM (playback) devices
echo "3. ALSA PCM Devices:"
echo "---------------------"
if command -v aplay &> /dev/null; then
    aplay -l
    echo ""
else
    echo "aplay command not found. Install alsa-utils to see detailed device info:"
    echo "  Ubuntu/Debian: sudo apt-get install alsa-utils"
    echo "  Fedora/RHEL:   sudo dnf install alsa-utils"
    echo ""
fi

# 4. USB audio devices
echo "4. USB Audio Devices (via lsusb):"
echo "-----------------------------------"
if command -v lsusb &> /dev/null; then
    lsusb | grep -i audio
    if [ $? -ne 0 ]; then
        echo "No USB audio devices found with lsusb."
    fi
    echo ""
else
    echo "lsusb command not found. Install usbutils to see USB devices:"
    echo "  Ubuntu/Debian: sudo apt-get install usbutils"
    echo "  Fedora/RHEL:   sudo dnf install usbutils"
    echo ""
fi

# 5. Provide configuration guidance
echo "=================================="
echo "Configuration Guide"
echo "=================================="
echo ""
echo "Based on the output above, here's how to configure USB DAC support:"
echo ""
echo "A. FOR DOCKER-COMPOSE.YML / DOCKER-COMPOSE.PROD.YML:"
echo "   Uncomment the device mapping lines under the 'app' service:"
echo ""
echo "   Option 1 - Pass through ALL audio devices (simplest):"
echo "   devices:"
echo "     - /dev/snd:/dev/snd"
echo ""
echo "   Option 2 - Pass through specific card (more secure):"
echo "   If your USB DAC is card 1 (check /proc/asound/cards output above):"
echo "   devices:"
echo "     - /dev/snd/controlC1:/dev/snd/controlC1"
echo "     - /dev/snd/pcmC1D0p:/dev/snd/pcmC1D0p"
echo ""
echo "   Note: Replace '1' with your actual card number from the output above."
echo ""
echo "B. FOR .ENV FILE:"
echo "   Add these environment variables:"
echo ""
echo "   ENABLE_AUDIO_PLAYBACK=true"
echo "   AUDIO_DEVICE=default          # Or hw:1,0 for card 1, device 0"
echo ""
echo "   To use a specific card (e.g., card 1), set:"
echo "   AUDIO_DEVICE=hw:1,0"
echo ""
echo "C. FOR PORTAINER:"
echo "   When editing the stack in Portainer:"
echo "   1. Go to Stacks > Your Stack > Editor"
echo "   2. Uncomment the 'devices:' section under the 'app' service"
echo "   3. Update environment variables in the Environment variables section"
echo "   4. Click 'Update the stack'"
echo ""
echo "=================================="
echo "Testing Audio Playback"
echo "=================================="
echo ""
echo "After configuration, test audio playback in the container:"
echo ""
echo "  docker exec -it myapp speaker-test -t wav -c 2"
echo ""
echo "Or test with a specific device:"
echo "  docker exec -it myapp speaker-test -D hw:1,0 -t wav -c 2"
echo ""
echo "Press Ctrl+C to stop the test."
echo ""
