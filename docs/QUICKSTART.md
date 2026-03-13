# Quickstart

> **Up and running in 5 minutes.**  
> For the full guide with manual steps and troubleshooting, see [INSTALL.md](INSTALL.md).

---

## Prerequisites

- Arch Linux with `yay` installed
- A Wayland-capable GPU (AMD recommended)
- `git` installed

---

## Step 1 — Clone

```bash
git clone https://github.com/Crowdrocker/wehttamsnaps-dots.git ~/wehttamsnaps-dots
cd ~/wehttamsnaps-dots
```

---

## Step 2 — Run the installer

```bash
chmod +x install.sh && ./install.sh
```

That's it for the base install. The script installs all packages, deploys all configs, and sets up systemd services. Log is written to `~/.cache/wehttamsnaps/install.log`.

---

## Step 3 — Log out and back in

Log out of your current session and select **SwayFX** from your display manager, or start it from a TTY:

```bash
exec sway
```

---

## Step 4 — Apply the Noctalia theme

Once SwayFX is running:

```bash
qs ipc call noctalia-shell setColorScheme WehttamSnaps
```

Or: `Super + ,` → Theming → Color Scheme → WehttamSnaps → Apply

---

## Step 5 — Add sound clips

The voices aren't in the repo (copyright). Download them and drop them in place:

| Voice | Source | Destination |
|-------|--------|-------------|
| J.A.R.V.I.S. | [101soundboards.com/boards/10155](https://www.101soundboards.com/boards/10155-jarvis-v1-paul-bettany) | `/usr/share/wehttamsnaps/sounds/jarvis/` |
| iDroid | [101soundboards.com/boards/10060](https://www.101soundboards.com/boards/10060-idroid-voice) | `/usr/share/wehttamsnaps/sounds/idroid/` |

Verify:
```bash
sound-system list
sound-system play startup jarvis
```

---

## You're in. Here's what does what.

### Essential keybinds

| Key | Action |
|-----|--------|
| `Super + D` | App launcher (Rofi drun) |
| `Super + Space` | Noctalia launcher |
| `Super + J` | J.A.R.V.I.S. menu |
| `Super + H` | Keybind cheat sheet |
| `Super + Q` | Close window |
| `Super + G` | Toggle gaming mode |
| `Super + Ctrl + L` | Lock screen |
| `Super + Ctrl + X` | Power menu |

### Workspaces

| Key | Workspace |
|-----|-----------|
| `Super + 1` | BROWSER |
| `Super + 2` | TERM |
| `Super + 3` | GAMING |
| `Super + 4` | STREAM |
| `Super + 5` | PHOTO |
| `Super + 6` | MEDIA |
| `Super + 7` | COMMS |
| `Super + 8` | MUSIC |
| `Super + 9` | FILES |
| `Super + 0` | SYS |

### Sound system

```bash
sound-system status          # check current voice mode
sound-system mute            # toggle mute with voice feedback
sound-system gaming-toggle   # switch iDroid ↔ J.A.R.V.I.S.
```

### J.A.R.V.I.S. voice commands

```bash
jarvis open brave            # launch app with voice feedback
jarvis gaming mode           # enable gaming mode
jarvis screenshot            # capture + sound
jarvis interactive           # interactive command shell
```

### Cheat sheet

```bash
generate_cheatsheet.sh       # regenerate after changing keybinds
generate_cheatsheet.sh --open  # regenerate and open in Brave
```

---

## Gaming setup (RX 580)

Add to each game's Steam launch options:

```
RADV_PERFTEST=gpl AMD_VULKAN_ICD=RADV gamemoderun %command%
```

Toggle gaming mode with `Super + G` — this enables iDroid voice, kills blur/shadows for max FPS, and sets the CPU to performance governor.

---

## Customising

| What | Where |
|------|-------|
| Keybinds | `~/.config/sway/config.d/05-keybinds.conf` |
| Colors | `~/.config/noctalia/colorschemes/WehttamSnaps/WehttamSnaps.json` |
| Workspaces | `~/.config/sway/config.d/07-workspaces.conf` |
| Visual effects | `~/.config/sway/config.d/02-visual.conf` |
| Autostart apps | `~/.config/sway/config.d/08-autostart.conf` |
| Terminal | `~/.config/ghostty/config` |
| Prompt | `~/.config/starship.toml` |
| Fastfetch | `~/.config/fastfetch/config.jsonc` |

After editing keybinds: `Super + Shift + C` to reload SwayFX.

After editing Noctalia theme JSON: restart Noctalia via `Super + ,` or `qs ipc call noctalia-shell reload`.

---

## Something broke?

```bash
# SwayFX config errors
sway --validate

# Rofi theme errors  
rofi -show drun -theme ~/.config/rofi/themes/wehttamsnaps.rasi

# Sound not working
sound-system status
systemctl --user status pipewire

# Full logs
cat ~/.cache/wehttamsnaps/install.log
```

See [INSTALL.md → Troubleshooting](INSTALL.md#7-troubleshooting) for more.

---

*[wehttamsnaps-dots](https://github.com/Crowdrocker/wehttamsnaps-dots) · [twitch.tv/WehttamSnaps](https://twitch.tv/WehttamSnaps) · [youtube.com/@WehttamSnaps](https://youtube.com/@WehttamSnaps)*
