import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // listen on the home network too, so phones on the same Wi-Fi can open it
    host: true,
    // send API calls to the Express server, so the browser sees one address
    proxy: {
      '/items': 'http://localhost:3000',
    },
  },
})
