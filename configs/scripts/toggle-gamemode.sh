#!/usr/bin/env bash
# Toggle Gaming Mode — WehttamSnaps
GAMING_FLAG="$HOME/.cache/wehttamsnaps/gaming-mode.active"
if [[ -f "$GAMING_FLAG" ]]; then
    rm "$GAMING_FLAG"
    # Restore normal picom
    pkill picom || true
    picom --config ~/.config/picom.conf &
    sound-system gaming-toggle 2>/dev/null || true
    notify-send "Gaming Mode OFF" "J.A.R.V.I.S. active" -i input-gaming
else
    touch "$GAMING_FLAG"
    # Kill compositor for performance
    pkill picom || true
    sound-system gaming-toggle 2>/dev/null || true
    notify-send "Gaming Mode ON" "iDroid active — max performance" -i input-gaming
fi
