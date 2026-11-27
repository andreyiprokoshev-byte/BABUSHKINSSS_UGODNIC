#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, WebviewWindowBuilder};

fn main() -> tauri::Result<()> {
    let smoke_test = std::env::args_os().any(|arg| arg == "--smoke-test");

    tauri::Builder::default()
        .setup(move |app| {
            let config = &app.config().app.windows[0];
            let mut window = WebviewWindowBuilder::from_config(app, config)?;
            if smoke_test {
                window = window
                    .initialization_script(include_str!("../../scripts/desktop_smoke.js"))
                    .on_document_title_changed(|window, title| {
                        if title == "desktop-smoke: PASS" {
                            println!("{title}");
                            window.app_handle().exit(0);
                        } else if title.starts_with("desktop-smoke: FAIL") {
                            eprintln!("{title}");
                            window.app_handle().exit(1);
                        }
                    });
            }
            let window = window.build()?;
            if smoke_test {
                window.on_window_event(|event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                    }
                });
            }
            Ok(())
        })
        .run(tauri::generate_context!())
}
