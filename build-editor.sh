#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR/editor"

echo "==> Building PAKET Studio frontend..."
npm run build

echo "==> Building release binary..."
cd src-tauri
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

