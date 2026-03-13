// ╔══════════════════════════════════════════════════════════════════╗
// ║  MO2 Linux Helper — Tauri Backend                               ║
// ║  All commands exposed to the React frontend                     ║
// ║  github.com/Crowdrocker  |  twitch.tv/WehttamSnaps              ║
// ╚══════════════════════════════════════════════════════════════════╝

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Command;


// ════════════════════════════════════════════════════════════════════
//  TYPES
// ════════════════════════════════════════════════════════════════════

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub mo2_exe: String,
    pub proton_path: String,
    pub wine_prefix: String,
    pub steam_path: String,
    pub instances_dir: String,
    pub sounds_enabled: bool,
    pub sound_mode: String, // "jarvis" | "idroid"
    pub nxm_handler_registered: bool,
}

impl Default for AppConfig {
    fn default() -> Self {
        let home = dirs::home_dir()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();
        Self {
            mo2_exe: format!("{home}/.local/share/Steam/steamapps/common/MO2/ModOrganizer.exe"),
            proton_path: String::new(),
            wine_prefix: format!("{home}/.local/share/Steam/steamapps/compatdata/2601980/pfx"),
            steam_path: String::from("/run/media/wehttamsnaps/LINUXDRIVE/SteamLibrary"),
            instances_dir: String::from("/run/media/wehttamsnaps/LINUXDRIVE/Modlist_Packs"),
            sounds_enabled: true,
            sound_mode: String::from("jarvis"),
            nxm_handler_registered: false,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MO2Instance {
    pub name: String,
    pub path: String,
    pub game: String,
    pub profile: String,
    pub last_used: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GameFix {
    pub id: String,
    pub game: String,
    pub description: String,
    pub env_vars: Vec<(String, String)>,
    pub proton_args: Vec<String>,
    pub notes: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NonSteamShortcut {
    pub name: String,
    pub exe: String,
    pub start_dir: String,
    pub icon: String,
    pub launch_options: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CommandResult {
    pub success: bool,
    pub message: String,
    pub data: Option<serde_json::Value>,
}

impl CommandResult {
    fn ok(msg: &str) -> Self {
        Self { success: true, message: msg.to_string(), data: None }
    }
    fn ok_data(msg: &str, data: serde_json::Value) -> Self {
        Self { success: true, message: msg.to_string(), data: Some(data) }
    }
    fn err(msg: &str) -> Self {
        Self { success: false, message: msg.to_string(), data: None }
    }
}

// ════════════════════════════════════════════════════════════════════
//  CONFIG COMMANDS
// ════════════════════════════════════════════════════════════════════

#[tauri::command]
pub fn load_config() -> CommandResult {
    let config_path = config_path();
    if config_path.exists() {
        match std::fs::read_to_string(&config_path) {
            Ok(s) => match serde_json::from_str::<AppConfig>(&s) {
                Ok(cfg) => CommandResult::ok_data("Config loaded", serde_json::to_value(cfg).unwrap()),
                Err(e) => CommandResult::err(&format!("Parse error: {e}")),
            },
            Err(e) => CommandResult::err(&format!("Read error: {e}")),
        }
    } else {
        let default = AppConfig::default();
        CommandResult::ok_data("Using defaults", serde_json::to_value(default).unwrap())
    }
}

#[tauri::command]
pub fn save_config(config: AppConfig) -> CommandResult {
    let path = config_path();
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    match serde_json::to_string_pretty(&config) {
        Ok(s) => match std::fs::write(&path, s) {
            Ok(_) => CommandResult::ok("Config saved"),
            Err(e) => CommandResult::err(&format!("Write error: {e}")),
        },
        Err(e) => CommandResult::err(&format!("Serialize error: {e}")),
    }
}

fn config_path() -> PathBuf {
    dirs::config_dir()
        .unwrap_or_default()
        .join("mo2-linux-helper")
        .join("config.json")
}

// ════════════════════════════════════════════════════════════════════
//  MO2 INSTANCE COMMANDS
// ════════════════════════════════════════════════════════════════════

#[tauri::command]
pub fn list_instances(instances_dir: String) -> CommandResult {
    let dir = PathBuf::from(&instances_dir);
    if !dir.exists() {
        return CommandResult::err(&format!("Directory not found: {instances_dir}"));
    }

    let mut instances = Vec::new();
    if let Ok(entries) = std::fs::read_dir(&dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                // Check for MO2 portable instance markers
                let has_mo2 = path.join("ModOrganizer.ini").exists()
                    || path.join("profiles").exists()
                    || path.join("mods").exists();

                if has_mo2 {
                    let name = path.file_name()
                        .unwrap_or_default()
                        .to_string_lossy()
                        .to_string();

                    // Try to detect game from ini
                    let game = detect_game_from_instance(&path);

                    instances.push(MO2Instance {
                        name: name.clone(),
                        path: path.to_string_lossy().to_string(),
                        game,
                        profile: String::from("Default"),
                        last_used: None,
                    });
                }
            }
        }
    }

    CommandResult::ok_data(
        &format!("Found {} instances", instances.len()),
        serde_json::to_value(instances).unwrap(),
    )
}

fn detect_game_from_instance(path: &PathBuf) -> String {
    let ini_path = path.join("ModOrganizer.ini");
    if let Ok(content) = std::fs::read_to_string(ini_path) {
        for line in content.lines() {
            if line.starts_with("gameName=") {
                return line.replace("gameName=", "").trim().to_string();
            }
        }
    }
    String::from("Unknown")
}

#[tauri::command]
pub fn launch_instance(
    mo2_exe: String,
    proton_path: String,
    wine_prefix: String,
    instance_path: String,
) -> CommandResult {
    if !PathBuf::from(&mo2_exe).exists() {
        return CommandResult::err(&format!("MO2 not found: {mo2_exe}"));
    }

    let proton = if proton_path.is_empty() {
        match find_proton() {
            Some(p) => p,
            None => return CommandResult::err("Proton not found. Set path in Settings."),
        }
    } else {
        proton_path
    };

    let result = Command::new(&proton)
        .env("STEAM_COMPAT_DATA_PATH", &wine_prefix)
        .env("STEAM_COMPAT_CLIENT_INSTALL_PATH",
            dirs::home_dir().unwrap_or_default().join(".local/share/Steam"))
        .arg("run")
        .arg(&mo2_exe)
        .arg(format!("--portable-instance={instance_path}"))
        .spawn();

    match result {
        Ok(_) => CommandResult::ok("MO2 launched"),
        Err(e) => CommandResult::err(&format!("Launch failed: {e}")),
    }
}

fn find_proton() -> Option<String> {
    let steam_root = PathBuf::from("/run/media/wehttamsnaps/LINUXDRIVE/SteamLibrary");
    let compat_dir = steam_root.join("steamapps/common");

    if compat_dir.exists() {
        if let Ok(entries) = std::fs::read_dir(&compat_dir) {
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_lowercase();
                if name.starts_with("proton") {
                    let proton_bin = entry.path().join("proton");
                    if proton_bin.exists() {
                        return Some(proton_bin.to_string_lossy().to_string());
                    }
                }
            }
        }
    }
    None
}

// ════════════════════════════════════════════════════════════════════
//  GAME FIX PROFILES
// ════════════════════════════════════════════════════════════════════

#[tauri::command]
pub fn get_game_fixes() -> CommandResult {
    let fixes = vec![
        GameFix {
            id: "skyrim-se".into(),
            game: "Skyrim Special Edition".into(),
            description: "SKSE + ENB + MO2 portable — recommended for large modlists".into(),
            env_vars: vec![
                ("RADV_PERFTEST".into(), "gpl".into()),
                ("AMD_VULKAN_ICD".into(), "RADV".into()),
                ("PROTON_USE_WINED3D".into(), "0".into()),
                ("DXVK_ASYNC".into(), "1".into()),
            ],
            proton_args: vec!["gamemoderun".into()],
            notes: "Use GE-Proton. Set SKSE as executable in MO2.".into(),
        },
        GameFix {
            id: "skyrim-vr".into(),
            game: "Skyrim VR".into(),
            description: "VR modlist — requires SteamVR running first".into(),
            env_vars: vec![
                ("RADV_PERFTEST".into(), "gpl".into()),
                ("AMD_VULKAN_ICD".into(), "RADV".into()),
                ("PROTON_USE_WINED3D".into(), "0".into()),
            ],
            proton_args: vec!["gamemoderun".into()],
            notes: "Start SteamVR before launching MO2.".into(),
        },
        GameFix {
            id: "fallout4".into(),
            game: "Fallout 4".into(),
            description: "F4SE + ENB + high-res texture packs".into(),
            env_vars: vec![
                ("RADV_PERFTEST".into(), "gpl".into()),
                ("AMD_VULKAN_ICD".into(), "RADV".into()),
                ("DXVK_ASYNC".into(), "1".into()),
                ("PROTON_NO_ESYNC".into(), "0".into()),
            ],
            proton_args: vec!["gamemoderun".into()],
            notes: "Set F4SE as executable. Disable in-game vsync.".into(),
        },
        GameFix {
            id: "fallout-nv".into(),
            game: "Fallout: New Vegas".into(),
            description: "TTW / Tale of Two Wastelands setup".into(),
            env_vars: vec![
                ("PROTON_USE_WINED3D".into(), "1".into()),
                ("PROTON_NO_ESYNC".into(), "1".into()),
            ],
            proton_args: vec![],
            notes: "Use Proton 8 or GE-Proton. WineD3D more stable than DXVK for NV.".into(),
        },
        GameFix {
            id: "oblivion".into(),
            game: "Oblivion".into(),
            description: "Oblivion Remastered / classic with OBSE".into(),
            env_vars: vec![
                ("PROTON_USE_WINED3D".into(), "0".into()),
                ("AMD_VULKAN_ICD".into(), "RADV".into()),
            ],
            proton_args: vec![],
            notes: "Set OBSE as executable in MO2 for classic. Remastered runs natively.".into(),
        },
        GameFix {
            id: "cyberpunk".into(),
            game: "Cyberpunk 2077".into(),
            description: "REDmod + Vortex alternative via MO2".into(),
            env_vars: vec![
                ("RADV_PERFTEST".into(), "gpl".into()),
                ("AMD_VULKAN_ICD".into(), "RADV".into()),
                ("WINE_FULLSCREEN_FSR".into(), "1".into()),
                ("PROTON_USE_WINED3D".into(), "0".into()),
            ],
            proton_args: vec!["gamemoderun".into()],
            notes: "GE-Proton recommended. FSR enabled for RX 580 performance.".into(),
        },
        GameFix {
            id: "witcher3".into(),
            game: "The Witcher 3".into(),
            description: "Script Merger + Next-Gen patch mods".into(),
            env_vars: vec![
                ("AMD_VULKAN_ICD".into(), "RADV".into()),
                ("PROTON_USE_WINED3D".into(), "0".into()),
            ],
            proton_args: vec!["gamemoderun".into()],
            notes: "Run Script Merger after installing mods.".into(),
        },
        GameFix {
            id: "starfield".into(),
            game: "Starfield".into(),
            description: "SFSE + large modlists".into(),
            env_vars: vec![
                ("RADV_PERFTEST".into(), "gpl".into()),
                ("AMD_VULKAN_ICD".into(), "RADV".into()),
                ("DXVK_ASYNC".into(), "1".into()),
            ],
            proton_args: vec!["gamemoderun".into()],
            notes: "Use GE-Proton 8+. Set SFSE as executable.".into(),
        },
        GameFix {
            id: "dragons-dogma2".into(),
            game: "Dragon's Dogma 2".into(),
            description: "Fluffy Manager / MO2 experimental support".into(),
            env_vars: vec![
                ("AMD_VULKAN_ICD".into(), "RADV".into()),
                ("RADV_PERFTEST".into(), "gpl".into()),
            ],
            proton_args: vec!["gamemoderun".into()],
            notes: "MO2 support is experimental. Backup saves first.".into(),
        },
        GameFix {
            id: "dark-souls-3".into(),
            game: "Dark Souls III".into(),
            description: "DSfix + texture/gameplay mods".into(),
            env_vars: vec![
                ("AMD_VULKAN_ICD".into(), "RADV".into()),
                ("PROTON_USE_WINED3D".into(), "0".into()),
            ],
            proton_args: vec![],
            notes: "Disable EAC via Steam properties for mods.".into(),
        },
        GameFix {
            id: "elden-ring".into(),
            game: "Elden Ring".into(),
            description: "Seamless Co-op + gameplay overhauls".into(),
            env_vars: vec![
                ("AMD_VULKAN_ICD".into(), "RADV".into()),
                ("RADV_PERFTEST".into(), "gpl".into()),
                ("DXVK_ASYNC".into(), "1".into()),
            ],
            proton_args: vec!["gamemoderun".into()],
            notes: "Launch offline for mod safety. GE-Proton recommended.".into(),
        },
        GameFix {
            id: "monster-hunter-world".into(),
            game: "Monster Hunter: World".into(),
            description: "Stracker's Loader + cosmetic mods".into(),
            env_vars: vec![
                ("AMD_VULKAN_ICD".into(), "RADV".into()),
                ("PROTON_USE_WINED3D".into(), "0".into()),
            ],
            proton_args: vec!["gamemoderun".into()],
            notes: "Use Proton 8. Stracker's Loader required for most mods.".into(),
        },
        GameFix {
            id: "no-mans-sky".into(),
            game: "No Man's Sky".into(),
            description: "MBINCompiler mods via MO2".into(),
            env_vars: vec![
                ("AMD_VULKAN_ICD".into(), "RADV".into()),
            ],
            proton_args: vec![],
            notes: "MBINCompiler must run on Windows or via Wine separately.".into(),
        },
        GameFix {
            id: "stardew-valley".into(),
            game: "Stardew Valley".into(),
            description: "SMAPI + content pack mods".into(),
            env_vars: vec![],
            proton_args: vec![],
            notes: "SMAPI has native Linux support. Set SMAPI as launch target.".into(),
        },
        GameFix {
            id: "baldurs-gate3".into(),
            game: "Baldur's Gate 3".into(),
            description: "BG3 Mod Manager / MO2 experimental".into(),
            env_vars: vec![
                ("AMD_VULKAN_ICD".into(), "RADV".into()),
                ("RADV_PERFTEST".into(), "gpl".into()),
            ],
            proton_args: vec!["gamemoderun".into()],
            notes: "Native Linux version available — prefer that over Proton.".into(),
        },
        GameFix {
            id: "mount-blade2".into(),
            game: "Mount & Blade II: Bannerlord".into(),
            description: "Vortex/MO2 via Proton for mod manager".into(),
            env_vars: vec![
                ("AMD_VULKAN_ICD".into(), "RADV".into()),
            ],
            proton_args: vec![],
            notes: "Native Linux build available. Mods load from game directory.".into(),
        },
        GameFix {
            id: "morrowind".into(),
            game: "Morrowind".into(),
            description: "OpenMW + MO2 for classic mods".into(),
            env_vars: vec![
                ("PROTON_USE_WINED3D".into(), "1".into()),
            ],
            proton_args: vec![],
            notes: "OpenMW has native Linux support and works with MO2 mods.".into(),
        },
        GameFix {
            id: "rimworld".into(),
            game: "RimWorld".into(),
            description: "Mod manager via MO2 (experimental)".into(),
            env_vars: vec![],
            proton_args: vec![],
            notes: "Native Linux. Use in-game mod manager or RimSort for best results.".into(),
        },
    ];

    CommandResult::ok_data(
        &format!("{} game profiles loaded", fixes.len()),
        serde_json::to_value(fixes).unwrap(),
    )
}

// ════════════════════════════════════════════════════════════════════
//  NXM LINK HANDLER
// ════════════════════════════════════════════════════════════════════

#[tauri::command]
pub fn register_nxm_handler(app_path: String) -> CommandResult {
    // Write .desktop file
    let desktop_content = format!(
        "[Desktop Entry]\n\
         Name=MO2 Linux Helper NXM Handler\n\
         Exec={app_path} nxm %u\n\
         Type=Application\n\
         MimeType=x-scheme-handler/nxm;\n\
         NoDisplay=true\n"
    );

    let desktop_dir = dirs::data_dir()
        .unwrap_or_default()
        .join("applications");
    let _ = std::fs::create_dir_all(&desktop_dir);
    let desktop_path = desktop_dir.join("mo2-linux-helper-nxm.desktop");

    if let Err(e) = std::fs::write(&desktop_path, &desktop_content) {
        return CommandResult::err(&format!("Failed to write .desktop: {e}"));
    }

    // Register with xdg-mime
    let result = Command::new("xdg-mime")
        .args(["default", "mo2-linux-helper-nxm.desktop", "x-scheme-handler/nxm"])
        .output();

    // Update desktop database
    let _ = Command::new("update-desktop-database")
        .arg(desktop_dir.to_str().unwrap_or(""))
        .output();

    match result {
        Ok(out) if out.status.success() => CommandResult::ok("NXM handler registered"),
        Ok(out) => CommandResult::err(&format!(
            "xdg-mime failed: {}",
            String::from_utf8_lossy(&out.stderr)
        )),
        Err(e) => CommandResult::err(&format!("xdg-mime not found: {e}")),
    }
}

#[tauri::command]
pub fn handle_nxm_url(url: String) -> CommandResult {
    // Parse nxm://game/mods/modid/files/fileid?...
    match url::Url::parse(&url) {
        Ok(parsed) => {
            let game = parsed.host_str().unwrap_or("unknown").to_string();
            let segments: Vec<&str> = parsed.path_segments()
                .map(|s| s.collect())
                .unwrap_or_default();

            let mod_id = segments.get(1).unwrap_or(&"0").to_string();
            let file_id = segments.get(3).unwrap_or(&"0").to_string();

            CommandResult::ok_data(
                "NXM URL parsed",
                serde_json::json!({
                    "game": game,
                    "mod_id": mod_id,
                    "file_id": file_id,
                    "raw": url,
                }),
            )
        }
        Err(e) => CommandResult::err(&format!("Invalid NXM URL: {e}")),
    }
}

// ════════════════════════════════════════════════════════════════════
//  NON-STEAM SHORTCUT CREATOR
// ════════════════════════════════════════════════════════════════════

#[tauri::command]
pub fn create_non_steam_shortcut(shortcut: NonSteamShortcut) -> CommandResult {
    // Write a .desktop file the user can add to Steam
    let desktop_content = format!(
        "[Desktop Entry]\n\
         Name={}\n\
         Exec={} {}\n\
         Path={}\n\
         Icon={}\n\
         Type=Application\n\
         Categories=Game;\n",
        shortcut.name,
        shortcut.exe,
        shortcut.launch_options,
        shortcut.start_dir,
        shortcut.icon,
    );

    let desktop_dir = dirs::data_dir()
        .unwrap_or_default()
        .join("applications");
    let _ = std::fs::create_dir_all(&desktop_dir);
    let safe_name = shortcut.name.replace(' ', "-").to_lowercase();
    let desktop_path = desktop_dir.join(format!("mo2-{safe_name}.desktop"));

    match std::fs::write(&desktop_path, &desktop_content) {
        Ok(_) => {
            // Also write a steam_shortcut.vdf snippet for manual import
            let vdf = format!(
                "\"{}\" {{\n  \"AppName\" \"{}\"\n  \"Exe\" \"{}\"\n  \"StartDir\" \"{}\"\n  \"LaunchOptions\" \"{}\"\n}}\n",
                safe_name, shortcut.name, shortcut.exe, shortcut.start_dir, shortcut.launch_options
            );
            CommandResult::ok_data(
                &format!("Shortcut created: {}", desktop_path.display()),
                serde_json::json!({ "desktop_path": desktop_path, "vdf_snippet": vdf }),
            )
        }
        Err(e) => CommandResult::err(&format!("Failed: {e}")),
    }
}

// ════════════════════════════════════════════════════════════════════
//  PROTON PREFIX DETECTOR
// ════════════════════════════════════════════════════════════════════

#[tauri::command]
pub fn scan_proton_versions() -> CommandResult {
    let mut versions = Vec::new();

    // Common Proton locations
    let search_paths = vec![
        PathBuf::from("/run/media/wehttamsnaps/LINUXDRIVE/SteamLibrary/steamapps/common"),
        dirs::home_dir().unwrap_or_default()
            .join(".local/share/Steam/steamapps/common"),
        dirs::home_dir().unwrap_or_default()
            .join(".steam/root/compatibilitytools.d"),
        PathBuf::from("/usr/share/steam/compatibilitytools.d"),
    ];

    for base in &search_paths {
        if !base.exists() { continue; }
        if let Ok(entries) = std::fs::read_dir(base) {
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_lowercase();
                if name.contains("proton") {
                    let proton_bin = entry.path().join("proton");
                    if proton_bin.exists() {
                        versions.push(serde_json::json!({
                            "name": entry.file_name().to_string_lossy(),
                            "path": proton_bin.to_string_lossy(),
                        }));
                    }
                }
            }
        }
    }

    CommandResult::ok_data(
        &format!("Found {} Proton versions", versions.len()),
        serde_json::json!(versions),
    )
}

#[tauri::command]
pub fn scan_wine_prefixes(compatdata_path: String) -> CommandResult {
    let dir = PathBuf::from(&compatdata_path);
    if !dir.exists() {
        return CommandResult::err(&format!("Not found: {compatdata_path}"));
    }

    let mut prefixes = Vec::new();
    if let Ok(entries) = std::fs::read_dir(&dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let pfx = path.join("pfx");
                if pfx.exists() {
                    prefixes.push(serde_json::json!({
                        "app_id": entry.file_name().to_string_lossy(),
                        "path": pfx.to_string_lossy(),
                    }));
                }
            }
        }
    }

    CommandResult::ok_data(
        &format!("Found {} Wine prefixes", prefixes.len()),
        serde_json::json!(prefixes),
    )
}

// ════════════════════════════════════════════════════════════════════
//  J.A.R.V.I.S. INTEGRATION
// ════════════════════════════════════════════════════════════════════

#[tauri::command]
pub fn play_jarvis_sound(sound_name: String, mode: String) -> CommandResult {
    let sound_path = format!(
        "/usr/share/wehttamsnaps/sounds/{}/{}.mp3",
        mode, sound_name
    );

    if !PathBuf::from(&sound_path).exists() {
        // Try fallback mode
        let fallback = if mode == "jarvis" { "idroid" } else { "jarvis" };
        let fallback_path = format!(
            "/usr/share/wehttamsnaps/sounds/{}/{}.mp3",
            fallback, sound_name
        );
        if !PathBuf::from(&fallback_path).exists() {
            return CommandResult::err(&format!("Sound not found: {sound_name}"));
        }
        let _ = Command::new("paplay").arg(&fallback_path).spawn();
        return CommandResult::ok(&format!("Playing (fallback {fallback}): {sound_name}"));
    }

    match Command::new("paplay").arg(&sound_path).spawn() {
        Ok(_) => CommandResult::ok(&format!("Playing: {sound_name}")),
        Err(e) => CommandResult::err(&format!("paplay failed: {e}")),
    }
}

#[tauri::command]
pub fn get_sound_mode() -> CommandResult {
    let flag = dirs::cache_dir()
        .unwrap_or_default()
        .join("wehttamsnaps/gaming-mode.active");

    let mode = if flag.exists() { "idroid" } else { "jarvis" };
    CommandResult::ok_data(mode, serde_json::json!({ "mode": mode }))
}

// ════════════════════════════════════════════════════════════════════
//  SYSTEM UTILITIES
// ════════════════════════════════════════════════════════════════════

#[tauri::command]
pub fn open_directory(path: String) -> CommandResult {
    match Command::new("xdg-open").arg(&path).spawn() {
        Ok(_) => CommandResult::ok("Opened"),
        Err(e) => CommandResult::err(&format!("Failed: {e}")),
    }
}

#[tauri::command]
pub fn check_dependencies() -> CommandResult {
    let deps = vec![
        "proton", "wine", "xdg-mime", "paplay",
        "steam", "gamemoderun", "mangohud",
    ];

    let mut results = serde_json::Map::new();
    for dep in deps {
        let found = which::which(dep).is_ok();
        results.insert(dep.to_string(), serde_json::json!(found));
    }

    CommandResult::ok_data("Dependency check complete", serde_json::Value::Object(results))
}

// ════════════════════════════════════════════════════════════════════
//  APP ENTRY POINT
// ════════════════════════════════════════════════════════════════════

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            load_config,
            save_config,
            list_instances,
            launch_instance,
            get_game_fixes,
            register_nxm_handler,
            handle_nxm_url,
            create_non_steam_shortcut,
            scan_proton_versions,
            scan_wine_prefixes,
            play_jarvis_sound,
            get_sound_mode,
            open_directory,
            check_dependencies,
        ])
        .run(tauri::generate_context!())
        .expect("error while running MO2 Linux Helper");
}
