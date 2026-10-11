import { writable } from 'svelte/store'

// Préférences d'affichage partagées par les composants (réglages de l'app, D-J7).
// L'app charge et enregistre leur valeur (table meta) ; les composants se contentent de les lire.

/** Afficher les boutons « i » des mémos. */
export const showInfo = writable(true)
