#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════════╗
# ║                                                                          ║
# ║   ██╗    ██╗███████╗██╗  ██╗████████╗████████╗ █████╗ ███╗   ███╗       ║
# ║   ██║    ██║██╔════╝██║  ██║╚══██╔══╝╚══██╔══╝██╔══██╗████╗ ████║       ║
# ║   ██║ █╗ ██║█████╗  ███████║   ██║      ██║   ███████║██╔████╔██║       ║
# ║   ██║███╗██║██╔══╝  ██╔══██║   ██║      ██║   ██╔══██║██║╚██╔╝██║       ║
# ║   ╚███╔███╔╝███████╗██║  ██║   ██║      ██║   ██║  ██║██║ ╚═╝ ██║       ║
# ║    ╚══╝╚══╝ ╚══════╝╚═╝  ╚═╝   ╚═╝      ╚═╝   ╚═╝  ╚═╝╚═╝     ╚═╝       ║
# ║                    ███████╗███╗   ██╗ █████╗ ██████╗ ███████╗            ║
# ║                    ██╔════╝████╗  ██║██╔══██╗██╔══██╗██╔════╝            ║
# ║                    ███████╗██╔██╗ ██║███████║██████╔╝███████╗            ║
# ║                    ╚════██║██║╚██╗██║██╔══██║██╔═══╝ ╚════██║            ║
# ║                    ███████║██║ ╚████║██║  ██║██║     ███████║            ║
# ║                    ╚══════╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝     ╚══════╝            ║
# ║                                                                          ║
# ║   WehttamSnaps Arch Linux Setup Installer                               ║
# ║   github.com/Crowdrocker  |  twitch.tv/WehttamSnaps                     ║
# ║                                                                          ║
# ║   Installs: SwayFX · Noctalia Shell · J.A.R.V.I.S. · Rofi Theme        ║
# ║             Gaming Stack · Photography Suite · PipeWire Audio           ║
# ║                                                                          ║
# ╚══════════════════════════════════════════════════════════════════════════╝

set -euo pipefail

# ══════════════════════════════════════════════════════════════════════════
#  COLORS & HELPERS
# ══════════════════════════════════════════════════════════════════════════
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PINK='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

DOTFILES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="$HOME/.config"
LOG_FILE="$HOME/.cache/wehttamsnaps/install.log"

mkdir -p "$HOME/.cache/wehttamsnaps"

log()     { echo -e "${CYAN}[J.A.R.V.I.S.]${NC} $*" | tee -a "$LOG_FILE"; }
success() { echo -e "${GREEN}  ✓${NC} $*" | tee -a "$LOG_FILE"; }
warn()    { echo -e "${YELLOW}  ⚠${NC}  $*" | tee -a "$LOG_FILE"; }
error()   { echo -e "${RED}  ✗${NC} $*" | tee -a "$LOG_FILE"; }
section() { echo -e "\n${BOLD}${BLUE}══════════════════════════════════════${NC}"; \
            echo -e "${BOLD}${CYAN}  $*${NC}"; \
            echo -e "${BOLD}${BLUE}══════════════════════════════════════${NC}\n"; }
ask()     { echo -en "${YELLOW}  ?${NC} $* ${CYAN}[y/N]${NC} "; read -r ans; [[ "$ans" =~ ^[Yy]$ ]]; }

# ══════════════════════════════════════════════════════════════════════════
#  PREFLIGHT CHECKS
# ══════════════════════════════════════════════════════════════════════════
preflight() {
    section "Preflight Checks"

    # Must be Arch Linux
    if [[ ! -f /etc/arch-release ]]; then
        error "This installer is designed for Arch Linux only."
        error "Detected: $(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d= -f2 || echo unknown)"
        exit 1
    fi
    success "Arch Linux detected"

    # Must NOT be run as root
    if [[ "$EUID" -eq 0 ]]; then
        error "Do not run this installer as root. Run as your normal user."
        exit 1
    fi
    success "Running as user: $USER"

    # Check for AUR helper (yay preferred, paru fallback)
    if command -v yay &>/dev/null; then
        AUR_HELPER="yay"
        success "AUR helper: yay"
    elif command -v paru &>/dev/null; then
        AUR_HELPER="paru"
        success "AUR helper: paru"
    else
        warn "No AUR helper found. Installing yay..."
        install_yay
    fi

    # Check internet
    if ! ping -c 1 archlinux.org &>/dev/null; then
        error "No internet connection detected. Please connect and retry."
        exit 1
    fi
    success "Internet connection OK"

    # Detect RX 580
    if lspci 2>/dev/null | grep -qi "RX 580"; then
        success "AMD RX 580 detected — applying RADV optimizations"
        HAS_RX580=true
    else
        warn "RX 580 not detected — skipping AMD-specific tweaks"
        HAS_RX580=false
    fi
}

install_yay() {
    log "Installing yay AUR helper..."
    sudo pacman -S --needed --noconfirm git base-devel
    local tmpdir
    tmpdir=$(mktemp -d)
    git clone https://aur.archlinux.org/yay.git "$tmpdir/yay"
    (cd "$tmpdir/yay" && makepkg -si --noconfirm)
    rm -rf "$tmpdir"
    AUR_HELPER="yay"
    success "yay installed"
}

# ══════════════════════════════════════════════════════════════════════════
#  PACKAGE INSTALLATION
# ══════════════════════════════════════════════════════════════════════════
install_packages() {
    section "Installing Packages"

    log "Updating system first..."
    sudo pacman -Syu --noconfirm
    success "System updated"

    # ── Core Wayland / SwayFX ──────────────────────────────────────────
    log "Installing SwayFX + Wayland stack..."
    $AUR_HELPER -S --needed --noconfirm \
        swayfx \
        niri \
        foot \
        swaylock-effects \
        swayidle \
        wl-clipboard \
        cliphist \
        grimblast-git \
        slurp \
        grim \
        xdg-desktop-portal-wlr \
        xdg-desktop-portal \
        polkit-gnome \
        xwayland
    success "SwayFX + Wayland stack installed"

    # ── Terminal ──────────────────────────────────────────────────────
    log "Installing Ghostty terminal..."
    $AUR_HELPER -S --needed --noconfirm ghostty || {
        warn "ghostty not found in AUR, falling back to foot"
        $AUR_HELPER -S --needed --noconfirm foot
    }
    success "Terminal installed"

    # ── Noctalia Shell ────────────────────────────────────────────────
    log "Installing Noctalia Shell..."
    $AUR_HELPER -S --needed --noconfirm noctalia-shell
    success "Noctalia Shell installed"

    # ── Rofi ─────────────────────────────────────────────────────────
    log "Installing Rofi (Wayland)..."
    $AUR_HELPER -S --needed --noconfirm rofi-wayland
    success "Rofi installed"

    # ── Fonts ─────────────────────────────────────────────────────────
    log "Installing fonts..."
    $AUR_HELPER -S --needed --noconfirm \
        ttf-jetbrains-mono-nerd \
        ttf-orbitron \
        ttf-rajdhani \
        noto-fonts \
        noto-fonts-emoji
    success "Fonts installed"

    # ── Notifications ─────────────────────────────────────────────────
    log "Installing dunst (fallback notifications)..."
    $AUR_HELPER -S --needed --noconfirm dunst libnotify
    success "dunst installed"

    # ── Theming ───────────────────────────────────────────────────────
    log "Installing themes and icons..."
    $AUR_HELPER -S --needed --noconfirm \
        papirus-icon-theme \
        bibata-cursor-theme-bin \
        tokyonight-gtk-theme-git \
        kvantum
    success "Themes installed"

    # ── Audio (PipeWire) ──────────────────────────────────────────────
    log "Installing PipeWire audio stack..."
    sudo pacman -S --needed --noconfirm \
        pipewire \
        pipewire-pulse \
        pipewire-alsa \
        pipewire-jack \
        wireplumber \
        pavucontrol \
        playerctl \
        brightnessctl
    $AUR_HELPER -S --needed --noconfirm qpwgraph helvum
    success "PipeWire stack installed"

    # ── J.A.R.V.I.S. audio playback ──────────────────────────────────
    log "Installing audio players (for J.A.R.V.I.S. sounds)..."
    sudo pacman -S --needed --noconfirm mpv ffmpeg
    success "mpv + ffmpeg installed"

    # ── File managers ─────────────────────────────────────────────────
    log "Installing file managers..."
    $AUR_HELPER -S --needed --noconfirm thunar dolphin
    success "Thunar + Dolphin installed"

    # ── Browsers ──────────────────────────────────────────────────────
    log "Installing Brave browser..."
    $AUR_HELPER -S --needed --noconfirm brave-bin
    success "Brave installed"

    # ── Editors ───────────────────────────────────────────────────────
    log "Installing Kate editor..."
    $AUR_HELPER -S --needed --noconfirm kate
    success "Kate installed"

    # ── Screenshot / Screen recording ─────────────────────────────────
    log "Installing OBS Studio..."
    $AUR_HELPER -S --needed --noconfirm obs-studio
    success "OBS installed"

    # ── Photography suite ─────────────────────────────────────────────
    log "Installing photography workflow apps..."
    $AUR_HELPER -S --needed --noconfirm \
        darktable \
        digikam \
        gimp \
        krita \
        rawtherapee \
        inkscape
    success "Photography suite installed"

    # ── Gaming stack ──────────────────────────────────────────────────
    log "Installing gaming stack..."
    # Enable multilib first (required for Steam)
    if ! grep -q "^\[multilib\]" /etc/pacman.conf; then
        log "Enabling multilib repository..."
        sudo sed -i '/^#\[multilib\]/,/^#Include/ s/^#//' /etc/pacman.conf
        sudo pacman -Sy
    fi
    sudo pacman -S --needed --noconfirm \
        steam \
        lib32-mesa \
        lib32-vulkan-radeon \
        vulkan-radeon \
        mesa
    $AUR_HELPER -S --needed --noconfirm \
        proton-ge-custom \
        lutris \
        gamemode \
        lib32-gamemode \
        gamescope \
        mangohud \
        lib32-mangohud \
        vkbasalt \
        protonup-qt
    success "Gaming stack installed"

    # ── Wine stack (for MO2 / modding) ───────────────────────────────
    log "Installing Wine + modding tools..."
    $AUR_HELPER -S --needed --noconfirm \
        wine-staging \
        winetricks \
        protontricks
    success "Wine stack installed"

    # ── System utilities ──────────────────────────────────────────────
    log "Installing system utilities..."
    $AUR_HELPER -S --needed --noconfirm \
        lm_sensors \
        htop \
        btop \
        fastfetch \
        starship \
        zsh \
        zram-generator \
        python-gobject \
        zenity \
        yad
    success "System utilities installed"
}

# ══════════════════════════════════════════════════════════════════════════
#  AMD RX 580 OPTIMIZATIONS
# ══════════════════════════════════════════════════════════════════════════
setup_amd() {
    if [[ "$HAS_RX580" != true ]]; then return; fi

    section "AMD RX 580 Optimizations"

    log "Writing AMD environment variables to /etc/environment..."
    local env_file="/etc/environment"
    local vars=(
        "AMD_VULKAN_ICD=RADV"
        "RADV_PERFTEST=gpl"
        "DISABLE_LAYER_AMD_SWITCHABLE_GRAPHICS_1=1"
    )
    for var in "${vars[@]}"; do
        local key="${var%%=*}"
        if grep -q "^$key=" "$env_file" 2>/dev/null; then
            sudo sed -i "s|^$key=.*|$var|" "$env_file"
            warn "Updated existing $key in /etc/environment"
        else
            echo "$var" | sudo tee -a "$env_file" > /dev/null
            success "Added $var to /etc/environment"
        fi
    done

    log "Detecting sensors (lm_sensors)..."
    sudo sensors-detect --auto &>/dev/null || true
    success "AMD RX 580 setup complete"
}

# ══════════════════════════════════════════════════════════════════════════
#  ZRAM (compressed swap — helps with 16GB RAM + gaming)
# ══════════════════════════════════════════════════════════════════════════
setup_zram() {
    section "ZRAM Setup"
    log "Configuring ZRAM (compressed swap)..."

    sudo tee /etc/systemd/zram-generator.conf > /dev/null << 'EOF'
[zram0]
zram-size = ram / 2
compression-algorithm = zstd
EOF

    sudo systemctl daemon-reload
    sudo systemctl start systemd-zram-setup@zram0.service 2>/dev/null || true
    success "ZRAM configured (RAM/2 = ~8GB compressed swap)"
}

# ══════════════════════════════════════════════════════════════════════════
#  DEPLOY DOTFILES
# ══════════════════════════════════════════════════════════════════════════
deploy_configs() {
    section "Deploying WehttamSnaps Configs"

    # ── SwayFX ────────────────────────────────────────────────────────
    log "Deploying SwayFX config..."
    mkdir -p "$CONFIG_DIR/sway/config.d"
    mkdir -p "$CONFIG_DIR/sway/scripts"
    mkdir -p "$CONFIG_DIR/sway/wallpapers"

    if [[ -d "$DOTFILES_DIR/configs/swayfx" ]]; then
        cp "$DOTFILES_DIR/configs/swayfx/config" "$CONFIG_DIR/sway/config"
        cp "$DOTFILES_DIR/configs/swayfx/config.d/"*.conf "$CONFIG_DIR/sway/config.d/"
        cp "$DOTFILES_DIR/configs/swayfx/scripts/"*.sh "$CONFIG_DIR/sway/scripts/"
        chmod +x "$CONFIG_DIR/sway/scripts/"*.sh
        success "SwayFX config deployed"
    else
        warn "configs/swayfx/ not found — skipping SwayFX deploy"
    fi

    # ── Noctalia color scheme ─────────────────────────────────────────
    log "Deploying Noctalia WehttamSnaps color scheme..."
    mkdir -p "$CONFIG_DIR/noctalia/colorschemes/WehttamSnaps"
    if [[ -f "$DOTFILES_DIR/colorschemes/WehttamSnaps/WehttamSnaps.json" ]]; then
        cp "$DOTFILES_DIR/colorschemes/WehttamSnaps/WehttamSnaps.json" \
           "$CONFIG_DIR/noctalia/colorschemes/WehttamSnaps/"
        success "WehttamSnaps color scheme deployed"
        log "Apply it: Noctalia Settings → Theming → Color Scheme → WehttamSnaps"
    else
        warn "WehttamSnaps.json not found — skipping Noctalia color scheme"
    fi

    # ── Rofi theme ────────────────────────────────────────────────────
    log "Deploying Rofi J.A.R.V.I.S. theme..."
    mkdir -p "$CONFIG_DIR/rofi/themes"
    if [[ -d "$DOTFILES_DIR/rofi/themes" ]]; then
        cp "$DOTFILES_DIR/rofi/themes/"*.rasi "$CONFIG_DIR/rofi/themes/"
        cp "$DOTFILES_DIR/rofi/config.rasi"   "$CONFIG_DIR/rofi/"
        success "Rofi theme deployed"
    else
        warn "rofi/themes/ not found — skipping Rofi theme deploy"
    fi

    # ── Rofi scripts → sway scripts ───────────────────────────────────
    if [[ -d "$DOTFILES_DIR/rofi/scripts" ]]; then
        cp "$DOTFILES_DIR/rofi/scripts/"*.sh "$CONFIG_DIR/sway/scripts/"
        chmod +x "$CONFIG_DIR/sway/scripts/"*.sh
        success "Rofi helper scripts deployed"
    fi

    # ── J.A.R.V.I.S. sound system binaries ───────────────────────────
    log "Installing J.A.R.V.I.S. sound system..."
    if [[ -f "$DOTFILES_DIR/bin/sound-system" ]]; then
        sudo cp "$DOTFILES_DIR/bin/sound-system"   /usr/local/bin/sound-system
        sudo cp "$DOTFILES_DIR/bin/jarvis"         /usr/local/bin/jarvis
        sudo cp "$DOTFILES_DIR/bin/jarvis-menu"    /usr/local/bin/jarvis-menu
        sudo chmod +x /usr/local/bin/sound-system /usr/local/bin/jarvis /usr/local/bin/jarvis-menu
        success "J.A.R.V.I.S. binaries installed to /usr/local/bin/"
    else
        warn "bin/ directory not found — skipping J.A.R.V.I.S. binary install"
        warn "Copy manually: sudo cp sound-system jarvis jarvis-menu /usr/local/bin/"
    fi

    # ── Sound directories ─────────────────────────────────────────────
    log "Creating J.A.R.V.I.S. sound directories..."
    sudo mkdir -p /usr/share/wehttamsnaps/sounds/jarvis
    sudo mkdir -p /usr/share/wehttamsnaps/sounds/idroid
    sudo chown -R "$USER:$USER" /usr/share/wehttamsnaps
    success "Sound directories created at /usr/share/wehttamsnaps/sounds/"

    if [[ -d "$DOTFILES_DIR/sounds/jarvis" ]]; then
        cp "$DOTFILES_DIR/sounds/jarvis/"*.mp3 /usr/share/wehttamsnaps/sounds/jarvis/ 2>/dev/null || true
        cp "$DOTFILES_DIR/sounds/idroid/"*.mp3 /usr/share/wehttamsnaps/sounds/idroid/ 2>/dev/null || true
        success "J.A.R.V.I.S. sound files deployed"
    else
        warn "sounds/ directory not found"
        warn "Download from 101soundboards.com:"
        warn "  jarvis-v1-paul-bettany-tts-computer-ai-voice → /usr/share/wehttamsnaps/sounds/jarvis/"
        warn "  idroid-tts-computer-ai-voice                 → /usr/share/wehttamsnaps/sounds/idroid/"
    fi

    # ── Dashboard HTML ────────────────────────────────────────────────
    log "Deploying J.A.R.V.I.S. dashboard..."
    mkdir -p "$CONFIG_DIR/wehttamsnaps/dashboard"
    if [[ -f "$DOTFILES_DIR/docs/wehttamsnaps-jarvis-dashboard.html" ]]; then
        cp "$DOTFILES_DIR/docs/wehttamsnaps-jarvis-dashboard.html" \
           "$CONFIG_DIR/wehttamsnaps/dashboard/index.html"
        success "Dashboard deployed → $CONFIG_DIR/wehttamsnaps/dashboard/index.html"
    fi

    # ── logo.txt ──────────────────────────────────────────────────────
    if [[ -f "$DOTFILES_DIR/logo.txt" ]]; then
        cp "$DOTFILES_DIR/logo.txt" "$CONFIG_DIR/wehttamsnaps/"
        success "logo.txt deployed"
    fi
}

# ══════════════════════════════════════════════════════════════════════════
#  STEAM LIBRARY PATHS
# ══════════════════════════════════════════════════════════════════════════
setup_steam_paths() {
    section "Steam Library Setup"

    local drive="/run/media/$USER/LINUXDRIVE"

    if [[ -d "$drive" ]]; then
        log "LINUXDRIVE detected at $drive"

        # Add Steam library via steam config
        local steam_cfg="$HOME/.steam/steam/steamapps"
        mkdir -p "$steam_cfg"

        if [[ -d "$drive/SteamLibrary" ]]; then
            success "SteamLibrary found at $drive/SteamLibrary"
            log "Add it in Steam: Settings → Storage → Add Drive"
            log "Path: $drive/SteamLibrary"
        fi

        if [[ -d "$drive/Modlist_Packs" ]]; then
            success "Modlist_Packs found at $drive/Modlist_Packs"
        fi
        if [[ -d "$drive/Modlist_Downloads" ]]; then
            success "Modlist_Downloads found at $drive/Modlist_Downloads"
        fi
    else
        warn "LINUXDRIVE not mounted at $drive"
        warn "Mount your 1TB drive first, then re-run to configure Steam paths"
        warn "Expected paths:"
        warn "  $drive/SteamLibrary"
        warn "  $drive/Modlist_Packs"
        warn "  $drive/Modlist_Downloads"
    fi
}

# ══════════════════════════════════════════════════════════════════════════
#  SUDO NOPASSWD FOR GAMEMODE GOVERNOR TOGGLE
# ══════════════════════════════════════════════════════════════════════════
setup_sudo_rules() {
    section "Sudo Rules"
    log "Adding nopasswd rule for CPU governor toggle (gaming mode)..."

    local rule_file="/etc/sudoers.d/wehttamsnaps-gamemode"
    local rule="$USER ALL=(ALL) NOPASSWD: /usr/bin/tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor"

    echo "$rule" | sudo tee "$rule_file" > /dev/null
    sudo chmod 440 "$rule_file"
    success "Sudo rule added: CPU governor toggle without password"
}

# ══════════════════════════════════════════════════════════════════════════
#  SYSTEMD USER SERVICES
# ══════════════════════════════════════════════════════════════════════════
setup_services() {
    section "Enabling Services"

    log "Enabling PipeWire user services..."
    systemctl --user enable --now pipewire pipewire-pulse wireplumber 2>/dev/null || true
    success "PipeWire enabled"

    log "Enabling GameMode daemon..."
    systemctl --user enable --now gamemoded 2>/dev/null || true
    success "GameMode enabled"

    log "Running lm_sensors detection..."
    sudo sensors-detect --auto &>/dev/null || true
    success "lm_sensors configured"
}

# ══════════════════════════════════════════════════════════════════════════
#  GTK / QT THEME APPLICATION
# ══════════════════════════════════════════════════════════════════════════
apply_themes() {
    section "Applying Themes"

    log "Setting GTK theme (Tokyonight Dark)..."
    gsettings set org.gnome.desktop.interface gtk-theme      'Tokyonight-Dark-BL'  2>/dev/null || true
    gsettings set org.gnome.desktop.interface icon-theme     'Papirus-Dark'          2>/dev/null || true
    gsettings set org.gnome.desktop.interface cursor-theme   'Bibata-Modern-Classic' 2>/dev/null || true
    gsettings set org.gnome.desktop.interface cursor-size     24                     2>/dev/null || true
    gsettings set org.gnome.desktop.interface font-name      'JetBrainsMono Nerd Font 11' 2>/dev/null || true
    success "GTK theme applied"

    log "Setting Kvantum theme for Qt apps..."
    if command -v kvantummanager &>/dev/null; then
        kvantummanager --set KvantumDark 2>/dev/null || true
        success "Kvantum theme set"
    else
        warn "kvantummanager not found — set Qt theme manually"
    fi
}

# ══════════════════════════════════════════════════════════════════════════
#  POST-INSTALL SUMMARY
# ══════════════════════════════════════════════════════════════════════════
print_summary() {
    echo ""
    echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${CYAN}║         J.A.R.V.I.S. Installation Complete                  ║${NC}"
    echo -e "${BOLD}${CYAN}║         WehttamSnaps · github.com/Crowdrocker               ║${NC}"
    echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}  ✓${NC} SwayFX + Noctalia Shell"
    echo -e "${GREEN}  ✓${NC} J.A.R.V.I.S. Rofi Theme"
    echo -e "${GREEN}  ✓${NC} PipeWire Audio Stack"
    echo -e "${GREEN}  ✓${NC} Gaming Stack (Steam, Lutris, GameMode, Gamescope)"
    echo -e "${GREEN}  ✓${NC} Photography Suite (Darktable, DigiKam, GIMP, Krita)"
    echo -e "${GREEN}  ✓${NC} AMD RX 580 Optimizations"
    echo -e "${GREEN}  ✓${NC} ZRAM Compressed Swap"
    echo ""
    echo -e "${YELLOW}  Next steps:${NC}"
    echo ""
    echo -e "  ${CYAN}1.${NC} Download J.A.R.V.I.S. sounds from 101soundboards.com"
    echo -e "     → jarvis-v1-paul-bettany-tts-computer-ai-voice"
    echo -e "     → idroid-tts-computer-ai-voice"
    echo -e "     → Copy .mp3 files to ${CYAN}/usr/share/wehttamsnaps/sounds/jarvis/${NC}"
    echo -e "                         and ${CYAN}/usr/share/wehttamsnaps/sounds/idroid/${NC}"
    echo ""
    echo -e "  ${CYAN}2.${NC} Log out and start SwayFX session"
    echo -e "     → At login screen, select ${CYAN}SwayFX${NC} as your session"
    echo ""
    echo -e "  ${CYAN}3.${NC} Apply WehttamSnaps color scheme in Noctalia"
    echo -e "     → ${CYAN}Super + ,${NC}  →  Theming  →  Color Scheme  →  WehttamSnaps"
    echo ""
    echo -e "  ${CYAN}4.${NC} Add your Steam library drive"
    echo -e "     → Steam  →  Settings  →  Storage  →  Add Drive"
    echo -e "     → ${CYAN}/run/media/$USER/LINUXDRIVE/SteamLibrary${NC}"
    echo ""
    echo -e "  ${CYAN}5.${NC} Open keybinds cheat sheet anytime with ${CYAN}Super + H${NC}"
    echo ""
    echo -e "  ${PINK}Log file:${NC} $LOG_FILE"
    echo ""
}

# ══════════════════════════════════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════════════════════════════════
main() {
    clear
    echo -e "${CYAN}"
    cat << 'BANNER'
  ██╗    ██╗███████╗██╗  ██╗████████╗████████╗ █████╗ ███╗   ███╗███████╗███╗   ██╗ █████╗ ██████╗ ███████╗
  ██║    ██║██╔════╝██║  ██║╚══██╔══╝╚══██╔══╝██╔══██╗████╗ ████║██╔════╝████╗  ██║██╔══██╗██╔══██╗██╔════╝
  ██║ █╗ ██║█████╗  ███████║   ██║      ██║   ███████║██╔████╔██║███████╗██╔██╗ ██║███████║██████╔╝███████╗
  ██║███╗██║██╔══╝  ██╔══██║   ██║      ██║   ██╔══██║██║╚██╔╝██║╚════██║██║╚██╗██║██╔══██║██╔═══╝ ╚════██║
  ╚███╔███╔╝███████╗██║  ██║   ██║      ██║   ██║  ██║██║ ╚═╝ ██║███████║██║ ╚████║██║  ██║██║     ███████║
   ╚══╝╚══╝ ╚══════╝╚═╝  ╚═╝   ╚═╝      ╚═╝   ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝     ╚══════╝
BANNER
    echo -e "${NC}"
    echo -e "  ${CYAN}github.com/Crowdrocker${NC}  |  ${PINK}twitch.tv/WehttamSnaps${NC}  |  ${BLUE}@WehttamSnaps${NC}"
    echo ""
    echo -e "  This installer will set up your complete WehttamSnaps Arch Linux workstation."
    echo -e "  ${YELLOW}Estimated time: 15–30 minutes depending on internet speed.${NC}"
    echo ""

    if ! ask "Ready to begin installation?"; then
        log "Installation cancelled."
        exit 0
    fi

    preflight
    install_packages
    setup_amd
    setup_zram
    deploy_configs
    setup_steam_paths
    setup_sudo_rules
    setup_services
    apply_themes
    print_summary
}

main "$@"
