import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
		react(),
		nodePolyfills({
			globals: {
				Buffer: true
			}
		}),
	],
  preview: {
		port: 3000,
		strictPort: true,
		host: '0.0.0.0', 
		allowedHosts: true,
	},
  server: {
		allowedHosts: true
	}
});
