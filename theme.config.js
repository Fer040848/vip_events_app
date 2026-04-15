/** @type {const} */
const themeColors = {
  // Colores primarios vibrantes (inspirados en Partiful)
  primary: { light: '#6366F1', dark: '#818CF8' },
  primaryLight: { light: '#818CF8', dark: '#A5B4FC' },
  primaryDark: { light: '#4F46E5', dark: '#6366F1' },
  
  // Colores de acento (gradientes)
  accent: { light: '#EC4899', dark: '#F472B6' },
  accentLight: { light: '#F472B6', dark: '#FBCFE8' },
  
  // Colores de fondo
  background: { light: '#0F172A', dark: '#0F172A' },
  surface: { light: '#1E293B', dark: '#1E293B' },
  surfaceLight: { light: '#334155', dark: '#334155' },
  
  // Colores de texto
  foreground: { light: '#F8FAFC', dark: '#F8FAFC' },
  muted: { light: '#94A3B8', dark: '#94A3B8' },
  
  // Bordes
  border: { light: '#334155', dark: '#334155' },
  
  // Estados
  success: { light: '#10B981', dark: '#34D399' },
  warning: { light: '#F59E0B', dark: '#FBBF24' },
  error: { light: '#EF4444', dark: '#F87171' },
  
  // Colores especiales (legacy)
  gold: { light: '#C9A84C', dark: '#F5D78E' },
  goldLight: { light: '#F5D78E', dark: '#F5D78E' },
  darkCard: { light: '#1E293B', dark: '#1E293B' },
};

module.exports = { themeColors };
