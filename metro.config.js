const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const dotenv = require("dotenv");
const path = require("path");

// Cargar variables de entorno desde .env.local
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

const config = getDefaultConfig(__dirname);

// El entorno de desarrollo comparte recursos con la previsualización. Un único
// trabajador evita picos de memoria al compilar las rutas y dependencias heredadas.
config.maxWorkers = 1;

// Add 'web' to platforms so .web.ts/.web.js files are resolved correctly
// This fixes "codegenNativeComponent is not a function" on web for packages
// like react-native-svg, react-native-safe-area-context, react-native-screens
config.resolver.platforms = ["ios", "android", "web"];

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules
  // This fixes iOS styling issues in development mode
  forceWriteFileSystem: true,
});
