import type { CapacitorConfig } from '@capacitor/cli'

// appId est définitif après la première release (D-T5) : le changer crée une autre app sur le Chromebook
// (données non reprises).
const config: CapacitorConfig = {
  appId: 'fr.onepiecejdr.mj',
  appName: 'One Piece',
  webDir: 'dist',
  plugins: {
    CapacitorSQLite: {
      androidIsEncryption: false,
    },
  },
}

export default config
