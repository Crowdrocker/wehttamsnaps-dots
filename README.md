<div align="center">

```
██╗    ██╗███████╗██╗  ██╗████████╗████████╗ █████╗ ███╗   ███╗███████╗███╗   ██╗ █████╗ ██████╗ ███████╗
██║    ██║██╔════╝██║  ██║╚══██╔══╝╚══██╔══╝██╔══██╗████╗ ████║██╔════╝████╗  ██║██╔══██╗██╔══██╗██╔════╝
██║ █╗ ██║█████╗  ███████║   ██║      ██║   ███████║██╔████╔██║███████╗██╔██╗ ██║███████║██████╔╝███████╗
██║███╗██║██╔══╝  ██╔══██║   ██║      ██║   ██╔══██║██║╚██╔╝██║╚════██║██║╚██╗██║██╔══██║██╔═══╝ ╚════██║
╚███╔███╔╝███████╗██║  ██║   ██║      ██║   ██║  ██║██║ ╚═╝ ██║███████║██║ ╚████║██║  ██║██║     ███████║
 ╚══╝╚══╝ ╚══════╝╚═╝  ╚═╝   ╚═╝      ╚═╝   ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝     ╚══════╝
```

**Arch Linux · SwayFX · Noctalia Shell · J.A.R.V.I.S.**

*A modular, branded Wayland workstation for photography, gaming, streaming & content creation*

[![Arch Linux](https://img.shields.io/badge/Arch_Linux-1793D1?style=for-the-badge&logo=arch-linux&logoColor=white)](https://archlinux.org)
[![SwayFX](https://img.shields.io/badge/SwayFX-00ffd1?style=for-the-badge&logoColor=black)](https://github.com/WillPower3309/swayfx)
[![License: MIT](https://img.shields.io/badge/License-MIT-ff5af1?style=for-the-badge)](LICENSE)
[![Twitch](https://img.shields.io/badge/Twitch-WehttamSnaps-9146FF?style=for-the-badge&logo=twitch&logoColor=white)](https://twitch.tv/WehttamSnaps)
[![YouTube](https://img.shields.io/badge/YouTube-WehttamSnaps-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://youtube.com/@WehttamSnaps)

</div>

---

## 📸 About

**WehttamSnaps** is Matthew's personal Arch Linux workstation configuration — built for a dual life as a **wedding & photobooth photographer** and a **PC gamer**. Coming from Windows 11, the goal was to build something that feels like a custom OS, not just a tiled window manager.

> *WehttamSnaps = "WehttamSnaps" spelled backwards. Yes, really.*

**Hardware:**
| Component | Spec |
|-----------|------|
| Machine | Dell XPS 8700 |
| CPU | Intel i7-4790 @ 4.00GHz (8 threads) |
| RAM | 16GB DDR3 |
| GPU | AMD Radeon RX 580 |
| Display | 1920×1080 @ 60Hz |
| Boot SSD | 120GB (Arch) |
| Storage | 1TB (`/run/media/wehttamsnaps/LINUXDRIVE`) |

---

## ✨ Features

### 🤖 J.A.R.V.I.S. Sound System
- **Context-aware voices** — automatically switches between J.A.R.V.I.S. (Paul Bettany TTS) in normal/work mode and **iDroid** in gaming mode
- **48 J.A.R.V.I.S. clips** — startup, shutdown, app launches, volume, screenshots, workspace switches, time-of-day greetings and more
- **8 iDroid clips** — "Combat systems online", mission start, alerts, and more
- Every system event has audio feedback

### 🎮 Gaming Mode (`Super + G`)
- One keybind toggles: iDroid voice, disabled blur/shadows, CPU performance governor
- Pre-configured for **RX 580** with RADV Mesa optimizations (`AMD_VULKAN_ICD=RADV`, `RADV_PERFTEST=gpl`)
- GameMode + Gamescope integration
- Steam library on dedicated 1TB drive

### 📸 Photography Workflow
- Dedicated **Workspace 5** for the full photo pipeline
- Darktable → DigiKam → GIMP → Krita → Export
- J.A.R.V.I.S. announces export completion

### 🎨 Cyberpunk Brand Theme
- Custom **WehttamSnaps color scheme** for Noctalia Shell
  - Primary: `#00ffd1` Cyan
  - Secondary: `#3b82ff` Blue
  - Accent: `#ff5af1` Pink
  - Background: `#0a0014` Deep purple-black
- Matching Rofi J.A.R.V.I.S. theme with scanline aesthetic
- SwayFX blur, shadows, corner radius throughout

### 🔊 Audio Routing
- PipeWire + WirePlumber + qpwgraph
- Virtual sinks for streaming: `game_audio`, `browser_audio`, `comms_audio`
- Voicemeeter-style routing for OBS scenes

---

## 🗂️ Repository Structure

```
wehttamsnaps-dots/
├── install.sh                          # One-shot installer
├── README.md
├── logo.txt                            # ASCII brand art
│
├── configs/
│   └── swayfx/
│       ├── config                      # Entry point (includes config.d/*)
│       ├── config.d/
│       │   ├── 01-variables.conf       # Brand colors, fonts, paths
│       │   ├── 02-visual.conf          # SwayFX blur/shadows/animations
│       │   ├── 03-input.conf           # Keyboard, mouse, touchpad
│       │   ├── 04-output.conf          # Monitor layout, wallpaper
│       │   ├── 05-keybinds.conf        # All keybindings
│       │   ├── 06-windows.conf         # Window rules & assignments
│       │   ├── 07-workspaces.conf      # 10 workspaces + app assignments
│       │   ├── 08-autostart.conf       # Startup, Noctalia, J.A.R.V.I.S. boot
│       │   ├── 09-gaming.conf          # Gaming mode notes & paths
│       │   └── 10-bars.conf            # Noctalia IPC keybinds
│       └── scripts/
│           ├── jarvis-boot.sh          # Time-aware startup greeting
│           ├── toggle-gamemode.sh      # Gaming mode toggle
│           ├── toggle-mute.sh          # Adaptive mute sound
│           ├── launch-gamescope.sh     # Gamescope (RX 580 optimized)
│           ├── photo-export.sh         # Export helper + JARVIS sound
│           ├── workspace-watcher.sh    # Workspace → sound mode sync
│           ├── temp-monitor.sh         # CPU/GPU temp warnings
│           ├── keyhints.sh             # Keybinds cheat sheet (Super+H)
│           ├── powermenu.sh            # Power menu (Super+X)
│           └── clipboard.sh            # Clipboard manager (Super+V)
│
├── colorschemes/
│   └── WehttamSnaps/
│       └── WehttamSnaps.json           # Noctalia color scheme
│
├── rofi/
│   ├── config.rasi                     # Global Rofi config
│   └── themes/
│       ├── wehttamsnaps.rasi           # Main J.A.R.V.I.S. theme
│       ├── wehttamsnaps-keyhints.rasi  # 3-column keyhints variant
│       └── wehttamsnaps-powermenu.rasi # Power menu (pink accent)
│
├── bin/
│   ├── sound-system                    # Adaptive sound manager
│   ├── jarvis                          # J.A.R.V.I.S. voice assistant CLI
│   └── jarvis-menu                     # J.A.R.V.I.S. Rofi visual menu
│
├── sounds/
│   ├── jarvis/                         # 48 J.A.R.V.I.S. clips (not included*)
│   └── idroid/                         # 8 iDroid clips (not included*)
│
├── docs/
│   ├── INSTALL.md                      # Detailed install guide
│   ├── QUICKSTART.md                   # First boot guide
│   └── wehttamsnaps-jarvis-dashboard.html  # Interactive keybind dashboard
│
└── packages/
    └── package.list.txt                # Full package list
```

> \* Sound files are not included due to copyright. See [Sounds Setup](#-sounds-setup) below.

---

## ⚡ Quick Install

```bash
# 1. Clone the repo
git clone https://github.com/Crowdrocker/wehttamsnaps-dots
cd wehttamsnaps-dots

# 2. Run the installer
chmod +x install.sh
./install.sh
```

The installer will:
- ✅ Detect and configure your **AMD RX 580**
- ✅ Install the full package set via `yay` (AUR)
- ✅ Deploy all configs to the right locations
- ✅ Set up **Noctalia Shell** + **WehttamSnaps color scheme**
- ✅ Configure **PipeWire** audio routing
- ✅ Set up **ZRAM** compressed swap
- ✅ Install **Steam**, **Lutris**, **GameMode**, **Gamescope**
- ✅ Install photography suite (Darktable, DigiKam, GIMP, Krita)
- ✅ Add sudo rule for passwordless gaming mode governor toggle

> **Estimated time:** 15–30 minutes depending on internet speed.

---

## 🎯 Workspaces

| # | Name | Apps |
|---|------|------|
| 1 | Browser | Brave, Firefox |
| 2 | Terminal / Dev | Ghostty, Kate |
| 3 | Gaming | Steam, Lutris, Gamescope |
| 4 | Streaming | OBS Studio |
| 5 | Photography | Darktable, DigiKam, GIMP, Krita |
| 6 | Media | MPV, VLC, Kdenlive |
| 7 | Communications | Discord |
| 8 | Music / Audio | Spotify, qpwgraph, pavucontrol |
| 9 | Files | Thunar, Dolphin |
| 0 | System | Settings, ProtonUp-Qt |

---

## ⌨️ Key Bindings (Highlights)

> Press **`Super + H`** at any time for the full interactive cheat sheet.

| Keybind | Action |
|---------|--------|
| `Super + Space` | App Launcher (Noctalia) |
| `Super + Enter` | Ghostty Terminal |
| `Super + G` | **Toggle Gaming Mode** (iDroid voice) |
| `Super + J` | J.A.R.V.I.S. Menu (Rofi) |
| `Super + H` | Keybinds Cheat Sheet |
| `Super + X` | Power Menu |
| `Super + V` | Clipboard History |
| `Super + Shift + E` | Photo Export (J.A.R.V.I.S. feedback) |
| `Super + Alt + S` | Launch Steam |
| `Super + Shift + C` | Reload SwayFX Config |
| `Print` | Screenshot + J.A.R.V.I.S. sound |

---

## 🔊 Sounds Setup

Sound files are **not bundled** due to copyright. Download them yourself from [101soundboards.com](https://101soundboards.com):

**J.A.R.V.I.S. (Paul Bettany TTS):**
> Search: `jarvis-v1-paul-bettany-tts-computer-ai-voice`

**iDroid:**
> Search: `idroid-tts-computer-ai-voice`

Place files in:
```
/usr/share/wehttamsnaps/sounds/jarvis/   ← J.A.R.V.I.S. clips
/usr/share/wehttamsnaps/sounds/idroid/   ← iDroid clips
```

Test after placing files:
```bash
sound-system test
sound-system startup
sound-system gaming
```

**Expected filenames** — see [`docs/INSTALL.md`](docs/INSTALL.md) for the full list of 56 clips.

---

## 🎮 Gaming Setup

### Steam Library (1TB Drive)
After first boot, add your library in Steam:
> **Steam → Settings → Storage → Add Drive**
> Path: `/run/media/wehttamsnaps/LINUXDRIVE/SteamLibrary`

### MO2 (Mod Organizer 2) for Linux
For modding Cyberpunk 2077, Fallout 4, Skyrim etc. via Wine/Proton:
```bash
# Install dependencies
yay -S protontricks winetricks wine-staging

# Run MO2 via Lutris or as a non-Steam shortcut
# NXM link handler is configured in: ~/.local/share/applications/nxm-handler.desktop
```

**Recommended Steam launch options for RX 580:**
```
RADV_PERFTEST=gpl AMD_VULKAN_ICD=RADV gamemoderun %command%
```

**Cyberpunk 2077 specifically:**
```
PROTON_USE_WINED3D=0 WINE_FULLSCREEN_FSR=1 gamemoderun %command%
```

---

## 🌿 Branch Structure

| Branch | Purpose |
|--------|---------|
| `main` | Stable releases |
| `develop` | Integration / testing |
| `wehttamsnaps-theme` | Theming experiments |
| `wehttamsnaps-widgets` | Noctalia widget dev |
| `wallpapers` | Wallpaper collection |
| `jarvis-sounds` | Sound pack updates |
| `docs` | Documentation |
| `mo2-helper` | MO2 Linux Helper Tauri app |

---

## 📦 Core Package List

<details>
<summary>Click to expand full package list</summary>

**Wayland / SwayFX**
- `swayfx` `niri` `swaylock-effects` `swayidle` `wl-clipboard` `cliphist` `grimblast-git` `xdg-desktop-portal-wlr`

**Shell**
- `noctalia-shell` `ghostty` `rofi-wayland` `dunst`

**Audio**
- `pipewire` `pipewire-pulse` `wireplumber` `pavucontrol` `qpwgraph` `helvum` `playerctl` `mpv`

**Gaming**
- `steam` `proton-ge-custom` `lutris` `gamemode` `gamescope` `mangohud` `vkbasalt` `protonup-qt` `wine-staging` `winetricks` `protontricks`

**Photography**
- `darktable` `digikam` `gimp` `krita` `rawtherapee` `inkscape`

**Apps**
- `brave-bin` `kate` `thunar` `dolphin` `obs-studio`

**Theming**
- `papirus-icon-theme` `bibata-cursor-theme-bin` `tokyonight-gtk-theme-git` `kvantum`

**Fonts**
- `ttf-jetbrains-mono-nerd` `ttf-orbitron` `ttf-rajdhani`

**System**
- `lm_sensors` `btop` `fastfetch` `starship` `zram-generator`

</details>

---

## 🔧 Manual Install

If you prefer to install manually rather than running `install.sh`:

```bash
# 1. Install packages
yay -S swayfx noctalia-shell ghostty rofi-wayland \
       pipewire pipewire-pulse wireplumber \
       steam gamemode gamescope lutris proton-ge-custom \
       darktable digikam gimp krita

# 2. Copy SwayFX configs
mkdir -p ~/.config/sway/config.d ~/.config/sway/scripts
cp configs/swayfx/config ~/.config/sway/
cp configs/swayfx/config.d/*.conf ~/.config/sway/config.d/
cp configs/swayfx/scripts/*.sh ~/.config/sway/scripts/
chmod +x ~/.config/sway/scripts/*.sh

# 3. Install Noctalia color scheme
mkdir -p ~/.config/noctalia/colorschemes/WehttamSnaps
cp colorschemes/WehttamSnaps/WehttamSnaps.json \
   ~/.config/noctalia/colorschemes/WehttamSnaps/

# 4. Install Rofi theme
mkdir -p ~/.config/rofi/themes
cp rofi/config.rasi ~/.config/rofi/
cp rofi/themes/*.rasi ~/.config/rofi/themes/

# 5. Install J.A.R.V.I.S. binaries
sudo cp bin/sound-system bin/jarvis bin/jarvis-menu /usr/local/bin/
sudo chmod +x /usr/local/bin/sound-system /usr/local/bin/jarvis /usr/local/bin/jarvis-menu

# 6. Create sound directories
sudo mkdir -p /usr/share/wehttamsnaps/sounds/{jarvis,idroid}
sudo chown -R $USER:$USER /usr/share/wehttamsnaps

# 7. Set AMD environment (RX 580)
echo "AMD_VULKAN_ICD=RADV" | sudo tee -a /etc/environment
echo "RADV_PERFTEST=gpl"   | sudo tee -a /etc/environment
```

---

## 🖥️ J.A.R.V.I.S. Dashboard

An interactive cyberpunk-themed HTML dashboard covering all keybinds, sounds, setup steps, system info and repo structure is included at:

```
docs/wehttamsnaps-jarvis-dashboard.html
```

Open it in any browser or bind it to a key:
```bash
# Add to 05-keybinds.conf
bindsym $mod+F1 exec brave --app=file://$HOME/.config/wehttamsnaps/dashboard/index.html
```

---

## 🤝 Contributing

This is a personal dotfiles repo, but PRs and issues are welcome — especially for:
- New Noctalia widgets (gaming stats, photo workflow)
- Additional game fixes for the MO2 Linux Helper
- Wallpapers that fit the WehttamSnaps cyberpunk aesthetic
- Bug fixes for the J.A.R.V.I.S. sound system

---

## 📺 Follow WehttamSnaps

| Platform | Link |
|----------|------|
| 🎮 Twitch | [twitch.tv/WehttamSnaps](https://twitch.tv/WehttamSnaps) |
| 📺 YouTube | [@WehttamSnaps](https://youtube.com/@WehttamSnaps) |
| 🐙 GitHub | [github.com/Crowdrocker](https://github.com/Crowdrocker) |

---

<div align="center">

*Made with ❤️ by Matthew — Wedding Photographer · PC Gamer · Linux Enthusiast*

`Photography` · `Gaming` · `Content Creation` · `Arch Linux` · `SwayFX`

</div>
