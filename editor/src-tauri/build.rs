fn main() {
    println!("cargo:rerun-if-changed=../../built/dist/index.html");
    println!("cargo:rerun-if-changed=../../built/dist");
    tauri_build::build()
}
