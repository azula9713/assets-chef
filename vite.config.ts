import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import ReactCompilerPlugin from 'babel-plugin-react-compiler'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ plugins: [ReactCompilerPlugin] }),
  ],
})
