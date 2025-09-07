#![deny(clippy::unwrap_used)]

pub use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use fs_err as fs;

// Simplified settings management for the Tauri app
// This is a basic implementation that will be extended later
fn get_default_settings_dir() -> PathBuf {
    if cfg!(windows) {
        dirs::data_local_dir().unwrap_or_else(|| PathBuf::from(".")).join("bcml")
    } else {
        dirs::config_dir().unwrap_or_else(|| PathBuf::from(".")).join("bcml")
    }
}

fn get_settings_file() -> PathBuf {
    get_default_settings_dir().join("settings.json")
}

#[derive(Debug, Default, Serialize, Deserialize)]
struct SimpleSettings {
    pub game_dir: String,
    pub dlc_dir: String,
    pub cemu_dir: String,
    pub wiiu: bool,
    pub lang: String,
    pub store_dir: String,
}

impl SimpleSettings {
    fn load() -> Result<Self, String> {
        let settings_file = get_settings_file();
        if settings_file.exists() {
            let content = fs::read_to_string(&settings_file).map_err(|e| e.to_string())?;
            serde_json::from_str(&content).map_err(|e| e.to_string())
        } else {
            Ok(Self {
                store_dir: get_default_settings_dir().to_string_lossy().to_string(),
                wiiu: true,
                lang: "USen".to_string(),
                ..Default::default()
            })
        }
    }

    fn save(&self) -> Result<(), String> {
        let settings_file = get_settings_file();
        if let Some(parent) = settings_file.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        let content = serde_json::to_string_pretty(self).map_err(|e| e.to_string())?;
        fs::write(&settings_file, content).map_err(|e| e.to_string())
    }

    fn mods_dir(&self) -> PathBuf {
        let base_dir = if self.store_dir.is_empty() {
            get_default_settings_dir()
        } else {
            PathBuf::from(&self.store_dir)
        };
        base_dir.join(if self.wiiu { "mods" } else { "mods_nx" })
    }
}

// Tauri command structures
#[derive(Debug, Deserialize)]
pub struct ModDirArgs {
    mod_dir: String,
}

#[derive(Debug, Serialize)]
pub struct ModFile {
    path: String,
    modified: bool,
}

#[derive(Debug, Serialize)]
pub struct ModInfo {
    name: String,
    path: String,
    enabled: bool,
    priority: i32,
    description: Option<String>,
    version: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SettingsData {
    game_dir: String,
    dlc_dir: String,
    cemu_dir: String,
    wiiu: bool,
    lang: String,
    store_dir: String,
    export_dir: String,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn get_version() -> Result<String, String> {
    Ok("3.10.8".to_string())
}

#[tauri::command]
async fn sanity_check() -> Result<bool, String> {
    // Check if BCML setup is valid
    let settings = SimpleSettings::load()?;
    
    // Check if game directory exists and contains valid game files
    if !settings.game_dir.is_empty() {
        let game_dir = Path::new(&settings.game_dir);
        if !game_dir.exists() {
            return Ok(false);
        }
    }
    
    // Check if store directory exists
    let store_dir = PathBuf::from(&settings.store_dir);
    if !store_dir.exists() {
        fs::create_dir_all(&store_dir).map_err(|e| e.to_string())?;
    }
    
    // Check if mods directory exists
    let mods_dir = settings.mods_dir();
    if !mods_dir.exists() {
        fs::create_dir_all(&mods_dir).map_err(|e| e.to_string())?;
    }
    
    Ok(true)
}

#[tauri::command]
async fn get_mods() -> Result<Vec<ModInfo>, String> {
    let settings = SimpleSettings::load()?;
    let mods_dir = settings.mods_dir();
    
    if !mods_dir.exists() {
        return Ok(vec![]);
    }
    
    let mut mods = Vec::new();
    
    // Scan for mod directories
    for entry in fs::read_dir(&mods_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        
        if path.is_dir() && !path.file_name().unwrap_or_default().to_string_lossy().starts_with('.') {
            let mod_name = path.file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();
            
            // Skip special BCML directories
            if mod_name == "9999_BCML" {
                continue;
            }
            
            let enabled = !path.join(".disabled").exists();
            let mut description = None;
            let mut version = None;
            
            // Try to read mod metadata
            let info_file = path.join("info.json");
            if info_file.exists() {
                if let Ok(info_content) = fs::read_to_string(&info_file) {
                    if let Ok(info_json) = serde_json::from_str::<serde_json::Value>(&info_content) {
                        description = info_json.get("description")
                            .and_then(|v| v.as_str())
                            .map(|s| s.to_string());
                        version = info_json.get("version")
                            .and_then(|v| v.as_str())
                            .map(|s| s.to_string());
                    }
                }
            }
            
            // Extract priority from folder name (if numeric prefix exists)
            let priority = if let Some(first_part) = mod_name.split('_').next() {
                first_part.parse::<i32>().unwrap_or(0)
            } else {
                0
            };
            
            mods.push(ModInfo {
                name: mod_name,
                path: path.to_string_lossy().to_string(),
                enabled,
                priority,
                description,
                version,
            });
        }
    }
    
    // Sort by priority (higher priority first)
    mods.sort_by(|a, b| b.priority.cmp(&a.priority));
    
    Ok(mods)
}

#[tauri::command]
async fn get_settings() -> Result<SettingsData, String> {
    let settings = SimpleSettings::load()?;
    
    Ok(SettingsData {
        game_dir: settings.game_dir,
        dlc_dir: settings.dlc_dir,
        cemu_dir: settings.cemu_dir,
        wiiu: settings.wiiu,
        lang: settings.lang,
        store_dir: settings.store_dir,
        export_dir: "".to_string(), // Will be implemented later
    })
}

#[tauri::command]
async fn save_settings(settings_data: SettingsData) -> Result<(), String> {
    let settings = SimpleSettings {
        game_dir: settings_data.game_dir,
        dlc_dir: settings_data.dlc_dir,
        cemu_dir: settings_data.cemu_dir,
        wiiu: settings_data.wiiu,
        lang: settings_data.lang,
        store_dir: if settings_data.store_dir.is_empty() {
            get_default_settings_dir().to_string_lossy().to_string()
        } else {
            settings_data.store_dir
        },
    };
    
    settings.save()
}

#[tauri::command]
async fn toggle_mod(mod_path: String, enabled: bool) -> Result<(), String> {
    let mod_dir = Path::new(&mod_path);
    let disabled_file = mod_dir.join(".disabled");
    
    if enabled {
        // Enable mod by removing .disabled file
        if disabled_file.exists() {
            fs::remove_file(&disabled_file).map_err(|e| e.to_string())?;
        }
    } else {
        // Disable mod by creating .disabled file
        if !disabled_file.exists() {
            fs::write(&disabled_file, "").map_err(|e| e.to_string())?;
        }
    }
    
    Ok(())
}

#[tauri::command]
async fn uninstall_mod(mod_path: String) -> Result<(), String> {
    let mod_dir = Path::new(&mod_path);
    
    if !mod_dir.exists() {
        return Err("Mod directory does not exist".to_string());
    }
    
    // Safety check - ensure we're only deleting from the mods directory
    let settings = SimpleSettings::load()?;
    let mods_dir = settings.mods_dir();
    
    if !mod_dir.starts_with(&mods_dir) {
        return Err("Invalid mod path - not in mods directory".to_string());
    }
    
    // Remove the mod directory
    std::fs::remove_dir_all(mod_dir).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
async fn find_modified_files(args: ModDirArgs) -> Result<Vec<String>, String> {
    let mod_dir = Path::new(&args.mod_dir);
    
    if !mod_dir.exists() {
        return Err("Directory does not exist".to_string());
    }
    
    let mut modified_files = Vec::new();
    
    // Recursively scan directory for files
    fn scan_directory(dir: &Path, base_dir: &Path, files: &mut Vec<String>) -> Result<(), Box<dyn std::error::Error>> {
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();
            
            if path.is_file() {
                // Get relative path from base directory
                let relative_path = path.strip_prefix(base_dir)?;
                
                // For now, just check file extensions to identify potentially modified files
                // This is a simplified version - the full implementation would use hash checking
                if let Some(ext) = path.extension() {
                    let ext_str = ext.to_string_lossy().to_lowercase();
                    if matches!(ext_str.as_str(), "sbyml" | "byml" | "pack" | "sarc" | "smubin" | "sbfres") {
                        files.push(relative_path.to_string_lossy().to_string());
                    }
                }
            } else if path.is_dir() {
                // Skip hidden directories and special BCML directories
                if let Some(name) = path.file_name() {
                    let name_str = name.to_string_lossy();
                    if !name_str.starts_with('.') && name_str != "logs" && name_str != "options" {
                        scan_directory(&path, base_dir, files)?;
                    }
                }
            }
        }
        Ok(())
    }
    
    scan_directory(mod_dir, mod_dir, &mut modified_files).map_err(|e| e.to_string())?;
    
    Ok(modified_files)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_version,
            sanity_check,
            get_mods,
            get_settings,
            save_settings,
            toggle_mod,
            uninstall_mod,
            find_modified_files
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
