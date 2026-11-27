#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

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
                builder = builder.visible(false);
            }

            builder.build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Пирожковый Двор 3D");
}
