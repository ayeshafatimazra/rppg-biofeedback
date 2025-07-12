#!/bin/bash

# Build the Rust WASM module
echo "Building Rust WASM module..."
wasm-pack build --target web --out-dir ../public/wasm

# Copy the generated files to the public directory
echo "Copying WASM files to public directory..."
cp pkg/* ../public/wasm/

echo "WASM build complete!" 