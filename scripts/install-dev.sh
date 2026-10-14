#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/../app"
npm i -D tailwindcss @tailwindcss/vite jsdom vite-plugin-pwa @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest
