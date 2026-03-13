#!/usr/bin/env bash
# PipeWire Virtual Sinks — WehttamSnaps Streaming Setup
# Creates virtual audio sinks: Game, Browser, Mic, Music
echo "Setting up PipeWire virtual sinks for streaming..."
pw-cli create-node adapter factory.name=support.null-audio-sink \
    node.name="Game-Sink" media.class="Audio/Sink" audio.position=FL,FR || true
pw-cli create-node adapter factory.name=support.null-audio-sink \
    node.name="Browser-Sink" media.class="Audio/Sink" audio.position=FL,FR || true
pw-cli create-node adapter factory.name=support.null-audio-sink \
    node.name="Music-Sink" media.class="Audio/Sink" audio.position=FL,FR || true
echo "✓ Virtual sinks created — use qpwgraph to route"
