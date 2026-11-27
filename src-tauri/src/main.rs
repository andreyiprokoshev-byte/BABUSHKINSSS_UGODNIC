#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

fn main() {
    let smoke_test = std::env::args().any(|arg| arg == "--smoke-test");

    tauri::Builder::default()
        .setup(move |app| {
            let mut builder = tauri::WebviewWindowBuilder::new(
                app,
                "main",
                tauri::WebviewUrl::App("index.html".into()),
            )
            .title("Пирожковый Двор 3D")
            .inner_size(1280.0, 800.0)
            .min_inner_size(960.0, 600.0);

            if smoke_test {
                builder = builder
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

            let window = builder.build()?;
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
        .expect("error while running Пирожковый Двор 3D");
}
