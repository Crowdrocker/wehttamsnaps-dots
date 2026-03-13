# Installation Guide

> **Full setup guide for WehttamSnaps dotfiles**  
> For a 5-minute setup, see [QUICKSTART.md](QUICKSTART.md) instead.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone the Repository](#2-clone-the-repository)
3. [Run the Installer](#3-run-the-installer)
4. [Manual Installation](#4-manual-installation)
   - [SwayFX](#41-swayfx)
   - [Noctalia Shell](#42-noctalia-shell)
   - [Rofi Theme](#43-rofi-theme)
   - [J.A.R.V.I.S. Sound System](#44-jarvis-sound-system)
   - [Ghostty Terminal](#45-ghostty-terminal)
   - [Starship Prompt](#46-starship-prompt)
   - [Fastfetch](#47-fastfetch)
5. [Post-Install Setup](#5-post-install-setup)
   - [Sound Clips](#51-sound-clips)
   - [Noctalia Color Scheme](#52-noctalia-color-scheme)
   - [Gaming Mode](#53-gaming-mode)
   - [Steam Library](#54-steam-library)
6. [Hardware-Specific Notes](#6-hardware-specific-notes)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Prerequisites

### Required: Arch Linux

These dotfiles are built for **Arch Linux** with a Wayland session. They will not work on Ubuntu, Fedora, or other distributions without significant modification.

### Base packages to install before cloning

```bash
sudo pacman -S --needed git base-devel
```

### Verify you have yay (AUR helper)

```bash
which yay || git clone https://aur.archlinux.org/yay.git /tmp/yay \
    && cd /tmp/yay && makepkg -si
```

### Hardware requirements

| Component | Minimum | Tested on |
|-----------|---------|-----------|
| GPU | Any AMD or Intel (Wayland) | AMD RX 580 |
| RAM | 8GB | 16GB DDR3 |
| Display | Any resolution | 1920×1080 @ 60Hz |
| Storage | 20GB free | 120GB SSD (boot) + 1TB (data) |

> **Nvidia users:** SwayFX on Nvidia requires additional setup. See the [SwayFX wiki](https://github.com/WillPower3309/swayfx/wiki).

---

## 2. Clone the Repository

```bash
git clone https://github.com/Crowdrocker/wehttamsnaps-dots.git ~/wehttamsnaps-dots
cd ~/wehttamsnaps-dots
```

---

## 3. Run the Installer

The one-shot installer handles everything automatically:

```bash
chmod +x install.sh
./install.sh
```

The installer will:

- Check you're on Arch Linux and have `yay`
- Install all required packages via pacman + AUR
- Set up AMD RX 580 Mesa/RADV drivers (or prompt to skip)
- Configure ZRAM swap
- Deploy all configs to `~/.config/`
- Install `sound-system`, `jarvis`, `jarvis-menu` to `/usr/local/bin/`
- Set up systemd user services (PipeWire, gamemoded)
- Apply GTK and Kvantum theming
- Detect your Steam library location

The installer is **idempotent** — safe to run multiple times. It will not overwrite files it didn't create.

### Installer flags

```bash
./install.sh --dry-run      # Show what would be done without doing it
./install.sh --no-aur       # Skip AUR packages (pacman only)
./install.sh --skip-drivers # Skip AMD driver setup
```

---

## 4. Manual Installation

If you prefer to install components individually:

### 4.1 SwayFX

```bash
# Install SwayFX (drop-in replacement for sway)
yay -S swayfx

# Deploy configs
mkdir -p ~/.config/sway/config.d ~/.config/sway/scripts ~/.config/sway/wallpapers

cp configs/swayfx/config           ~/.config/sway/config
cp configs/swayfx/config.d/*       ~/.config/sway/config.d/
cp configs/swayfx/scripts/*        ~/.config/sway/scripts/
chmod +x ~/.config/sway/scripts/*

# Reload if already in a sway session
swaymsg reload
```

The config uses a modular `config.d/` structure loaded in order:

| File | Purpose |
|------|---------|
| `01-variables.conf` | Brand colours, paths, modifier key |
| `02-visual.conf` | SwayFX blur, shadows, opacity, corner radius |
| `03-input.conf` | Keyboard, mouse, cursor theme |
| `04-output.conf` | Resolution, scale, wallpaper |
| `05-keybinds.conf` | All keybindings |
| `06-windows.conf` | Floating rules, idle inhibit |
| `07-workspaces.conf` | 10 named workspaces |
| `08-autostart.conf` | Startup programs |
| `09-gaming.conf` | Gaming mode, Steam notes |
| `10-bars.conf` | Noctalia IPC integration |

### 4.2 Noctalia Shell

Noctalia Shell replaces Waybar, rofi launcher, dunst, swaylock, and the power menu in one package.

```bash
# Install Noctalia
yay -S noctalia-shell

# Deploy WehttamSnaps color scheme
mkdir -p ~/.config/noctalia/colorschemes/WehttamSnaps
cp colorschemes/WehttamSnaps/WehttamSnaps.json \
   ~/.config/noctalia/colorschemes/WehttamSnaps/

# Start Noctalia (or let 08-autostart.conf handle it)
qs -c noctalia-shell &
```

Apply the color scheme via Noctalia settings → Theming → Color Scheme → WehttamSnaps, or via IPC:

```bash
qs ipc call noctalia-shell setColorScheme WehttamSnaps
```

### 4.3 Rofi Theme

```bash
mkdir -p ~/.config/rofi/themes

cp rofi/config.rasi         ~/.config/rofi/
cp rofi/themes/*.rasi       ~/.config/rofi/themes/

# Test the theme
rofi -show drun -theme ~/.config/rofi/themes/wehttamsnaps.rasi
```

### 4.4 J.A.R.V.I.S. Sound System

```bash
# Install the three scripts
sudo cp bin/sound-system bin/jarvis bin/jarvis-menu /usr/local/bin/
sudo chmod +x /usr/local/bin/sound-system \
              /usr/local/bin/jarvis \
              /usr/local/bin/jarvis-menu

# Create sound directories
sudo mkdir -p /usr/share/wehttamsnaps/sounds/{jarvis,idroid}

# Set up sound library structure (creates README files with download links)
sound-system setup

# Test (will warn about missing clips until you add them)
sound-system status
sound-system list
```

See [section 5.1](#51-sound-clips) for downloading the actual sound clips.

### 4.5 Ghostty Terminal

```bash
# Install Ghostty
yay -S ghostty

mkdir -p ~/.config/ghostty
cp configs/ghostty/config ~/.config/ghostty/config
```

Key settings applied:
- Background `#080012` at 93% opacity (SwayFX blur shows through)
- Cursor: cyan `#00ffd1` blinking block
- JetBrainsMono Nerd Font 13pt with ligatures
- Native split panes: `Ctrl+Shift+D` / `Ctrl+Shift+E`

### 4.6 Starship Prompt

```bash
# Install Starship
curl -sS https://starship.rs/install.sh | sh

# Deploy config
cp configs/starship/starship.toml ~/.config/starship.toml

# Add to ~/.zshrc (or ~/.bashrc)
echo 'eval "$(starship init zsh)"' >> ~/.zshrc
```

Custom path substitutions are configured for:
- `/run/media/wehttamsnaps/LINUXDRIVE` → `󰆼 LINUXDRIVE`
- `SteamLibrary` → ` Steam`
- `Modlist_Packs` → `󰖺 Mods`

Edit `~/.config/starship.toml` to change these to match your own drive paths.

### 4.7 Fastfetch

```bash
# Install Fastfetch
sudo pacman -S fastfetch

mkdir -p ~/.config/fastfetch
cp configs/fastfetch/config.jsonc ~/.config/fastfetch/
cp configs/fastfetch/ws-logo.txt  ~/.config/fastfetch/

# Test
fastfetch
```

---

## 5. Post-Install Setup

### 5.1 Sound Clips

The sound clips are not included in the repo (copyright). You need to source them yourself.

**J.A.R.V.I.S. (Paul Bettany TTS) — 48 clips**  
Download from: https://www.101soundboards.com/boards/10155-jarvis-v1-paul-bettany

Place `.mp3` files in: `/usr/share/wehttamsnaps/sounds/jarvis/`

Required filenames (see `/usr/share/wehttamsnaps/sounds/jarvis/README.md` for the full list):

```
startup.mp3          shutdown.mp3         notification.mp3
audio-mute.mp3       audio-unmute.mp3     volume-up.mp3
volume-down.mp3      mic-mute.mp3         mic-unmute.mp3
workspace-switch.mp3 screenshot.mp3       window-close.mp3
photo-export.mp3     gamemode-off.mp3
```

**iDroid Voice — 8 clips**  
Download from: https://www.101soundboards.com/boards/10060-idroid-voice

Place `.mp3` files in: `/usr/share/wehttamsnaps/sounds/idroid/`

Required:
```
gamemode-on.mp3      steam-launch.mp3     notification.mp3
workspace-switch.mp3
```

Verify after placing:
```bash
sound-system list
sound-system test   # plays all clips sequentially
```

### 5.2 Noctalia Color Scheme

After starting Noctalia for the first time:

1. Open settings: `Super + ,`
2. Navigate to **Theming → Color Scheme**
3. Select **WehttamSnaps**
4. Click Apply

Or via terminal:
```bash
qs ipc call noctalia-shell setColorScheme WehttamSnaps
```

### 5.3 Gaming Mode

Gaming mode is toggled with `Super + G`. It:

- Switches sound system to iDroid voice
- Disables SwayFX blur and shadows (performance)
- Sets CPU governor to `performance`
- Creates `~/.cache/wehttamsnaps/gaming-mode.active` flag

**Steam launch options for RX 580** — paste into each game's Properties → Launch Options in Steam:

```
RADV_PERFTEST=gpl AMD_VULKAN_ICD=RADV gamemoderun %command%
```

For DX11/DX12 games via Proton:
```
PROTON_USE_WINED3D=0 PROTON_NO_ESYNC=0 gamemoderun %command%
```

### 5.4 Steam Library

If your Steam library is on a separate drive, ensure it's mounted before launching Steam. The default path assumed in these configs:

```
/run/media/wehttamsnaps/LINUXDRIVE/SteamLibrary
```

Edit `configs/swayfx/config.d/09-gaming.conf` and `configs/starship/starship.toml` to match your actual drive label and mount path.

---

## 6. Hardware-Specific Notes

### AMD RX 580 (tested hardware)

The configs are tuned for this card. The installer sets these up automatically, but for reference:

```bash
# Required packages
sudo pacman -S mesa vulkan-radeon libva-mesa-driver mesa-vdpau

# Verify RADV is active
vulkaninfo | grep "driverName"
# Should show: driverName = radv
```

### Other AMD cards

Should work without changes. If you have an RX 6000+ or RX 7000+ series card, you may want to remove `RADV_PERFTEST=gpl` from Steam launch options as it's a workaround for older cards.

### Intel integrated graphics

Remove the AMD-specific packages from the installer and replace with:
```bash
sudo pacman -S mesa vulkan-intel intel-media-driver
```

---

## 7. Troubleshooting

### SwayFX won't start

```bash
# Check for config errors
sway --validate

# Run from a TTY to see full error output
sway 2>&1 | tee ~/sway-debug.log
```

### Rofi theme errors

```bash
# Test theme directly
rofi -show drun -theme ~/.config/rofi/themes/wehttamsnaps.rasi

# Common fixes:
# - Ensure JetBrainsMono Nerd Font is installed
sudo pacman -S ttf-jetbrains-mono-nerd
```

### Sound system not playing

```bash
# Check PipeWire is running
systemctl --user status pipewire

# Check sound files exist
sound-system list

# Test a specific clip
sound-system play startup jarvis

# Check paplay works
paplay /usr/share/wehttamsnaps/sounds/jarvis/startup.mp3
```

### Noctalia not loading

```bash
# Check qs (Quickshell) is installed
which qs

# Start manually and check output
qs -c noctalia-shell 2>&1 | head -30

# Apply WehttamSnaps scheme after start
qs ipc call noctalia-shell setColorScheme WehttamSnaps
```

### Gaming mode keybind not working

```bash
# Check the script is executable
ls -la ~/.config/sway/scripts/toggle-gamemode.sh

# Run it manually
~/.config/sway/scripts/toggle-gamemode.sh

# Check the gaming flag state
ls ~/.cache/wehttamsnaps/gaming-mode.active && echo "GAMING" || echo "NORMAL"
```

### Workspace pills truncating in Noctalia

The workspace names in `07-workspaces.conf` are intentionally shortened:
`1:BROWSER 2:TERM 3:GAMING 4:STREAM 5:PHOTO 6:MEDIA 7:COMMS 8:MUSIC 9:FILES 10:SYS`

If they still truncate, adjust the Noctalia bar width in the color scheme JSON.

---

## Updating

```bash
cd ~/wehttamsnaps-dots
git pull

# Re-deploy configs (installer is safe to re-run)
./install.sh

# Or manually copy specific files
cp configs/swayfx/config.d/05-keybinds.conf ~/.config/sway/config.d/
swaymsg reload
```

---

*Part of [wehttamsnaps-dots](https://github.com/Crowdrocker/wehttamsnaps-dots) · Built live on [twitch.tv/WehttamSnaps](https://twitch.tv/WehttamSnaps)*
