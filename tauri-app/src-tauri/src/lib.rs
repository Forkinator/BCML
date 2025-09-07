#![feature(let_chains)]
#![deny(clippy::unwrap_used)]
// pub mod manager;
// pub mod mergers;
// pub mod settings;
// pub mod util;
pub use anyhow::Result;
use serde::{Deserialize, Serialize};

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_version,
            sanity_check
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
