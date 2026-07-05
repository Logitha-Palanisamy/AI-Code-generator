#!/usr/bin/env bash
set -e

echo "Building React frontend..."
cd frontend
npm install
npm run build

echo "Installing Python dependencies..."
cd ..
pip install -r requirements.txt