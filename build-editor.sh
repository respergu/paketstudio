#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR/editor"

echo "==> Building PAKET Studio frontend..."
npm run build

echo "==> Building release binary..."
cd src-tauri
# tauri-build copies the bundled resources (PAKET.jar, jre/) next to the binary on every build.
# jlink makes some JRE files read-only, so the copy left by a previous build can't be
# overwritten ("Permission denied (os error 13)"). Remove it; the build makes a fresh one.
rm -rf ../../built/target/release/jre
PATH="$HOME/.cargo/bin:$PATH" cargo build --release

echo "==> Clearing intermediate compiler artifacts..."
rm -rf ../../built/target/release/build \
       ../../built/target/release/deps \
       ../../built/target/release/lib* \
       ../../built/target/release/*.d \
       ../../built/target/release/_up_ \
       ../../built/target/release/examples \
       ../../built/target/release/incremental

echo "==> Build complete! Output executable:"
ls -lh ../../built/target/release/editor

