#![feature(let_chains)]
#![deny(clippy::unwrap_used)]
// pub mod manager;
// pub mod mergers;
// pub mod settings;
// pub mod util;
pub use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

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

#[derive(Debug, Deserialize)]
pub struct SettingsData {
    game_dir: String,
    dlc_dir: String,
    cemu_dir: String,
    wiiu: bool,
    lang: String,
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
    // TODO: Implement sanity check logic from Python version
    Ok(true)
}

#[tauri::command]
async fn get_mods() -> Result<Vec<ModInfo>, String> {
    // TODO: Implement actual mod loading logic
    // For now, return mock data to demonstrate the UI
    Ok(vec![
        ModInfo {
            name: "First Person Mode".to_string(),
            path: "/mods/first_person".to_string(),
            enabled: true,
            priority: 100,
            description: Some("Enables first person camera view".to_string()),
            version: Some("1.2.0".to_string()),
        },
        ModInfo {
            name: "Enhanced Graphics".to_string(),
            path: "/mods/enhanced_gfx".to_string(),
            enabled: false,
            priority: 200,
            description: Some("Improves game graphics and textures".to_string()),
            version: Some("2.1.0".to_string()),
        },
        ModInfo {
            name: "Quality of Life Pack".to_string(),
            path: "/mods/qol_pack".to_string(),
            enabled: true,
            priority: 150,
            description: Some("Collection of gameplay improvements".to_string()),
            version: Some("1.0.5".to_string()),
        },
    ])
}

#[tauri::command]
async fn get_settings() -> Result<SettingsData, String> {
    // TODO: Load actual settings from file
    Ok(SettingsData {
        game_dir: "".to_string(),
        dlc_dir: "".to_string(),
        cemu_dir: "".to_string(),
        wiiu: true,
        lang: "USen".to_string(),
    })
}

#[tauri::command]
async fn save_settings(settings: SettingsData) -> Result<(), String> {
    // TODO: Implement actual settings saving
    println!("Saving settings: {:?}", settings);
    Ok(())
}

#[tauri::command]
async fn toggle_mod(mod_path: String, enabled: bool) -> Result<(), String> {
    // TODO: Implement mod enabling/disabling
    println!("Toggling mod {} to {}", mod_path, enabled);
    Ok(())
}

#[tauri::command]
async fn uninstall_mod(mod_path: String) -> Result<(), String> {
    // TODO: Implement mod uninstallation
    println!("Uninstalling mod: {}", mod_path);
    Ok(())
}

#[tauri::command]
async fn find_modified_files(args: ModDirArgs) -> Result<Vec<String>, String> {
    // TODO: Implement actual file scanning
    println!("Scanning directory: {}", args.mod_dir);
    Ok(vec![
        "content/Actor/ActorInfo.product.sbyml".to_string(),
        "content/Pack/Bootup.pack".to_string(),
        "content/Map/MainField/A-1/A-1_Dynamic.smubin".to_string(),
    ])
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
                            fs::read(f)
                                .ok()
                                .map(|data| util::is_file_modded(&canon, &data))
                        })
                        .unwrap_or(false)
            })
            .collect()
    });
    println!("Found {} modified files...", files.len());
    let sarc_files: Vec<String> = py.allow_threads(|| -> Result<Vec<String>> {
        Ok(files
            .par_iter()
            .filter(|f| {
                fs::metadata(f).expect("No file metadata!?!?!?!").len() > 4
                    && f.extension()
                        .and_then(|ext| ext.to_str())
                        .map(|ext| botw_utils::extensions::SARC_EXTS.contains(&ext))
                        .unwrap_or(false)
            })
            .map(|file| -> Result<Vec<String>> {
                let sarc = Sarc::new(fs::read(file)?)?;
                find_modded_sarc_files(
                    &sarc,
                    file.starts_with(&dlc),
                    &unsafe { file.strip_prefix(mod_dir).unwrap_unchecked() }.to_slash_lossy(),
                )
            })
            .collect::<Result<Vec<_>>>()?
            .into_par_iter()
            .flatten()
            .collect())
    })?;
    println!("Found {} modified files in SARCs...", sarc_files.len());
    Ok(files
        .into_par_iter()
        .map(|file| file.to_slash_lossy())
        .chain(sarc_files.into_par_iter())
        .collect())
}

fn find_modded_sarc_files(sarc: &Sarc, aoc: bool, path: &str) -> Result<Vec<String>> {
    Ok(sarc
        .files()
        .filter(|f| f.name().is_some())
        .filter(|file| {
            let (f, d) = (file.unwrap_name(), file.data());
            let mut canon = f.cow_replace(".s", ".");
            if aoc {
                canon = Cow::Owned(["Aoc/0010", &canon].join(""));
            }
            util::is_file_modded(&canon, d)
        })
        .map(|file| -> Result<Vec<String>> {
            let (f, d) = (file.unwrap_name(), file.data());
            let mut modded_files: Vec<String> = vec![[path, f].join("//")];
            if !f.ends_with("ssarc")
                && d.len() > 0x40
                && (&d[..4] == b"SARC" || &d[0x11..0x15] == b"SARC")
            {
                let sarc = Sarc::new(d)?;
                modded_files.extend(find_modded_sarc_files(
                    &sarc,
                    aoc,
                    modded_files
                        .first()
                        .as_ref()
                        .expect("What a strange filename"),
                )?);
            }
            Ok(modded_files)
        })
        .collect::<Result<Vec<Vec<String>>>>()?
        .into_iter()
        .flatten()
        .collect())
}
