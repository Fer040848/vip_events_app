# VIP Events App — TODO

## Setup & Configuración
- [x] Inicializar proyecto Expo mobile-app
- [x] Leer documentación del servidor/DB
- [x] Crear design.md
- [x] Configurar tema VIP (colores dorado/negro)
- [x] Generar logo VIP y configurar branding

## Base de Datos y Backend
- [x] Definir esquema de tablas (events, invitations, orders, notifications)
- [x] Crear funciones de consulta en server/db.ts
- [x] Crear rutas tRPC en server/routers.ts
- [x] Ejecutar migraciones de base de datos

## Autenticación y Roles
- [x] Configurar pantalla de Login con OAuth
- [x] Implementar lógica de roles (admin/usuario)
- [x] Crear contexto de usuario global
- [x] Proteger rutas de admin

## Navegación y Estructura
- [x] Configurar tab bar para usuario (Home, Eventos, Mi QR, VIP, Perfil)
- [x] Configurar tab bar para admin (Dashboard, Escanear, Eventos, Invitados, Notificaciones)
- [x] Configurar iconos en icon-symbol.tsx
- [x] Crear layout raíz con providers

## Pantallas de Usuario
- [x] Home screen con banner de evento y accesos rápidos
- [x] Calendario de eventos (lista mensual con filtros)
- [x] Detalle de evento con información completa
- [x] Mi QR — generación y visualización de código QR
- [x] Checkout / Pago con link de MercadoPago
- [x] Pedidos VIP — menú de 5 artículos exclusivos
- [x] Centro de notificaciones en perfil
- [x] Perfil de usuario con estadísticas

## Pantallas de Admin
- [x] Dashboard admin con estadísticas
- [x] Escáner QR con cámara y modo manual
- [x] Gestión de invitados (lista + estados + check-in)
- [x] Crear/editar eventos con formulario completo
- [x] Enviar notificaciones con plantillas

## Funcionalidades Clave
- [x] Generación de QR único por usuario/evento
- [x] Escaneo de QR con cámara (admin)
- [x] Notificaciones en tiempo real
- [x] Integración con MercadoPago (link externo)
- [x] Mapa con ubicación del evento (Google Maps)
- [x] Sistema de pedidos VIP durante evento
- [x] Contador de cupos disponibles (30-40 invitados)

## UI/UX y Pulido
- [x] Tema oscuro VIP (negro/dorado) aplicado globalmente
- [x] Estados de carga y error en todas las pantallas
- [x] Feedback háptico en acciones principales
- [x] Pantalla de splash personalizada

## Pruebas y Entrega
- [x] Verificar flujos completos end-to-end
- [x] Revisar errores de TypeScript (0 errores)
- [x] Crear checkpoint final
- [x] Entregar al usuario

## Códigos de Acceso y Chat (Nueva Funcionalidad)
- [x] Crear tabla access_codes con 50 códigos tlc001-tlc050
- [x] Crear tabla chat_messages para mensajes en tiempo real
- [x] Crear tabla user_presence para usuarios conectados
- [x] Actualizar server/db.ts con funciones de códigos, chat y presencia
- [x] Actualizar server/routers.ts con rutas de códigos, chat y presencia
- [x] Reemplazar pantalla de login con entrada de código de invitación
- [x] Implementar pantalla de Chat en tiempo real
- [x] Mostrar usuarios conectados en el chat
- [x] Integrar Chat en tab bar de usuario y admin
- [x] Ejecutar migraciones de base de datos

## Mejoras v2 (Implementación de las 4 sugerencias)
- [x] Backend: ruta para actualizar nombre de usuario
- [x] Backend: ruta para guardar push token del dispositivo
- [x] Backend: ruta de polling de mensajes nuevos (afterId)
- [x] Backend: envío de push notifications desde admin
- [x] Pantalla de configuración de nombre al primer acceso
- [x] Redirección automática a setup-name si no tiene nombre personalizado
- [x] Polling automático del chat cada 5s
- [x] Presencia en tiempo real mejorada (actualizar al entrar/salir del chat)
- [x] Notificaciones push nativas desde el panel admin
- [x] Registrar push token al iniciar sesión

## Mejoras v3 (6 nuevas funcionalidades)
- [x] Cambio de nombre desde pantalla de Perfil
- [x] Reacciones emoji en mensajes del chat (👍 ❤️ 🎉)
- [x] Backend: tabla de reacciones y rutas tRPC
- [x] Notificación automática 1h antes del evento (botón en admin)
- [x] Contador regresivo al próximo evento en Home
- [x] Galería de fotos del evento (subir y ver fotos)
- [x] Estado de pedido VIP en tiempo real (polling)

## Bugs y Mejoras v4
- [x] BUGFIX: Corregir generación de QR en pantalla Mi QR
- [x] BUGFIX: Corregir formulario de crear/editar eventos en dashboard admin
- [x] Panel de gestión de pedidos VIP para admin (ver y cambiar estado)
- [x] Compartir QR por WhatsApp y guardar en galería
- [x] Modo oscuro/claro configurable desde el perfil
- [x] Mejora adicional 1: Tabla de posiciones/Leaderboard de comunidad VIP
- [x] Mejora adicional 2: Mapa interactivo del evento con navegación (Apple Maps, Google Maps, Waze)
- [x] Mejora adicional 3: Plantillas de recordatorio de pago automático en panel admin

## Seguridad v5 - Restricción de datos a admin
- [x] Proteger ruta users.list (solo admin)
- [x] Proteger ruta invitations.getAll (solo admin)
- [x] Proteger ruta vipOrders.getAllOrders (solo admin)
- [x] Proteger ruta chat.onlineUsers (solo admin)
- [x] Agregar ruta chat.onlineCount para usuarios regulares (solo conteo)
- [x] Leaderboard: ocultar códigos de acceso a usuarios regulares
- [x] Leaderboard: pestaña 'Conectados ahora' solo visible para admin
- [x] Chat: modal de usuarios online muestra lista completa solo a admin
- [x] Chat: usuarios regulares solo ven el conteo de conectados
- [x] Verificar que el panel admin solo sea accesible con códigos tlc001-tlc003

## Bug Fix v6 - Error Gradle Android
- [x] BUGFIX: react-native-gesture-handler falla en compilación Android (Gradle build failed)
- [x] Corregir kotlinVersion a 2.0.21 (requerido por react-native-gesture-handler v2.28.0)
- [x] Agregar compileSdkVersion: 35, targetSdkVersion: 35, buildToolsVersion: 35.0.0
- [x] Verificar compatibilidad de dependencias nativas con Expo SDK 54

## Bug Fix v7 - expo-barcode-scanner incompatible con Kotlin 2.0
- [x] Desinstalar expo-barcode-scanner (deprecado, incompatible con Kotlin 2.0.21)
- [x] Instalar expo-camera v16.0.18 (reemplazo oficial recomendado por Expo)
- [x] Agregar plugin expo-camera al app.config.ts con permisos de cámara
- [x] Verificar que no hay más dependencias incompatibles con Kotlin 2.0.21

## Bug Fix v8 - expo-camera MLKitBarcodeAnalyzer Kotlin 2.0 incompatibility
- [x] Parchear MLKitBarcodeAnalyzer.kt: cambiar emptyList() por mutableListOf() (fix Kotlin 2.0.21)
- [x] Crear archivo patches/expo-camera+16.0.18.patch para persistencia del parche
- [x] Agregar script postinstall: patch-package en package.json
