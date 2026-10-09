import type { CapacitorConfig } from '@capacitor/cli'

// appId est définitif après la première release (D-T5) : le changer crée une autre app sur le téléphone
// (données non reprises).
const config: CapacitorConfig = {
  appId: 'fr.onepiecejdr.joueur',
  appName: 'Vivre Card',
  webDir: 'dist',
  plugins: {
    CapacitorSQLite: {
      androidIsEncryption: false,
    },
  },
}

export default config
