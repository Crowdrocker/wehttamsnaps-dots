# MO2 Linux Helper

> A Tauri 2.x desktop app for running Mod Organizer 2 on Arch Linux via Proton/Wine.  
> Built for the WehttamSnaps gaming setup — cyberpunk theme, J.A.R.V.I.S. integration.

## Features

| Tab | What it does |
|-----|-------------|
| **Instances** | Scan `Modlist_Packs/` for portable MO2 instances, launch with one click |
| **Game Fixes** | 18 pre-configured launch option profiles (Skyrim SE, Fallout 4, Starfield…) |
| **NXM Handler** | Register as the system handler for `nxm://` Nexus Mods download links |
| **Shortcuts** | Create non-Steam `.desktop` shortcuts with correct Proton env vars |
| **Proton** | Detect all installed Proton versions + Wine prefix scanner |
| **Settings** | Configure paths, J.A.R.V.I.S. voice mode, sound test panel |

## Build

```bash
# Prerequisites
sudo pacman -S rustup nodejs npm webkit2gtk-4.1 libappindicator-gtk3
rustup default stable

# Install JS deps
npm install

# Dev mode (hot reload)
npm run tauri dev

# Production build
npm run tauri build
```

## Deploy

```bash
# After build, install the binary
sudo cp src-tauri/target/release/mo2-linux-helper /usr/local/bin/
sudo chmod +x /usr/local/bin/mo2-linux-helper

# Register as NXM handler (or use the in-app button)
mo2-linux-helper --register-nxm
```

## Config file

`~/.config/mo2-linux-helper/config.json`

```json
{
  "mo2_exe": "~/.local/share/Steam/steamapps/common/MO2/ModOrganizer.exe",
  "proton_path": "",
  "wine_prefix": "~/.local/share/Steam/steamapps/compatdata/2601980/pfx",
  "steam_path": "/run/media/wehttamsnaps/LINUXDRIVE/SteamLibrary",
  "instances_dir": "/run/media/wehttamsnaps/LINUXDRIVE/Modlist_Packs",
  "sounds_enabled": true,
  "sound_mode": "jarvis",
  "nxm_handler_registered": false
}
```

## Repo branch

`mo2-helper` — part of [wehttamsnaps-dots](https://github.com/Crowdrocker/wehttamsnaps-dots)

---

*WehttamSnaps · github.com/Crowdrocker · twitch.tv/WehttamSnaps*
