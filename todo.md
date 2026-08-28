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


## Integración Firebase Authentication v9
- [ ] Conectar pantalla de login a Firebase Auth (email/contraseña)
- [ ] Quitar ejemplo "tlc001" del campo de código
- [ ] Implementar sistema de códigos admin (primeros códigos = admin)
- [ ] Crear códigos automáticamente en Firestore al generarlos
- [ ] Diferenciar roles: admin vs usuario regular
- [ ] Admin puede crear nuevos códigos de acceso
- [ ] Admin puede compartir códigos generados
- [ ] Persistencia de sesión con Firebase

## Gestión de Pagos v9
- [ ] Admin puede cargar enlace de pago
- [ ] Enlace se actualiza automáticamente para todos los usuarios
- [ ] Usuarios pueden compartir foto de transferencia como comprobante
- [ ] Solo admin puede ver fotos de transferencia
- [ ] Admin puede marcar si usuario pagó o no
- [ ] Admin puede ver estado de pago de cada invitado

## Gestión de Eventos v9
- [ ] Admin puede crear eventos (ya existe)
- [ ] Admin puede editar eventos (ya existe)
- [ ] Admin puede borrar eventos (ya existe)
- [ ] Los eventos aparecen en la lista de usuarios (ya existe)

## Gestión de Invitados v9
- [ ] Admin puede ver lista completa de invitados (ya existe)
- [ ] Admin puede ver estado de pago de cada invitado (ya existe)
- [ ] Admin puede marcar pago manual
- [ ] Admin puede ver foto de comprobante de pago

## Productos VIP v9
- [ ] Admin puede crear productos VIP (editable)
- [ ] Admin puede editar productos VIP (solo visible para admin)
- [ ] Admin puede borrar productos VIP
- [ ] Usuarios pueden seleccionar productos VIP que desean
- [ ] Admin gestiona las solicitudes de productos VIP desde panel
- [ ] Campos editables para admin: nombre, descripción, precio

## Interfaz de Usuario v9
- [ ] Pantalla de login sin ejemplo de código
- [ ] Campo de código limpio sin placeholder "tlc001"
- [ ] Sección de carga de comprobante de pago en invitaciones
- [ ] Panel de gestión de pagos en admin
- [ ] Formulario editable de productos VIP para admin

## Base de Datos Firestore v9
- [ ] Colección: payment_links (url, created_by, created_at)
- [ ] Documento: invitations con campo payment_proof_url
- [ ] Documento: vip_products con campos editables para admin
- [ ] Documento: access_codes con campo role (admin/user)

## Rediseño Visual v10 - Dorado y Negro
- [x] Cambiar tema global (theme.config.js) a paleta dorado (#C9A84C) y negro (#0A0A0A)
- [x] Actualizar pantalla de inicio con colores dorado/negro (eliminar gradientes azul-rosa)
- [x] Actualizar tab bar inferior con colores dorado/negro
- [x] Actualizar header de navegación con colores dorado/negro
- [x] Actualizar sidebar/drawer con colores dorado/negro
- [x] Actualizar EventCard enhanced con colores dorado/negro
- [x] Actualizar pantalla de admin dashboard con colores dorado/negro
- [x] Verificar que pantalla de login mantiene colores dorado/negro
- [x] Barra de navegación inferior funcional con 5 pestañas (Inicio, Eventos, Mi QR, Chat, Perfil)
- [x] Verificar compilación sin errores de TypeScript

## Sistema de RSVPs v11
- [x] Hook useRsvps con AsyncStorage para persistencia local
- [x] Componente RsvpButton con 3 opciones (Voy, Tal vez, No puedo)
- [x] Componente RsvpStats para mostrar conteo de respuestas
- [x] Integración de RSVP en pantalla de detalle de evento
- [x] Mostrar estadísticas de RSVPs en detalle de evento
- [ ] Backend: crear tabla rsvps en DB (pendiente por conflicto de migraciones)
- [ ] Backend: rutas tRPC para sincronizar RSVPs con servidor
- [ ] Admin: panel para ver RSVPs por evento

## Notificaciones Push Nativas v11
- [x] Hook useNotifications para registrar permisos y token
- [x] Configurar listeners para notificaciones en foreground/background
- [x] Registrar token de push en el servidor
- [x] Instalación de expo-device
- [ ] Prueba de notificaciones push en dispositivo físico
- [ ] Integración de envío de push desde admin

## Revisión Estética v11
- [x] Revisar coherencia visual en pantalla de inicio
- [x] Verificar paleta dorado/negro en componentes principales
- [x] Pantalla de detalle de evento con colores consistentes
- [x] Componentes de RSVP con colores coherentes
- [ ] Revisar pantallas de admin (dashboard, eventos, invitados)
- [ ] Revisar pantalla de chat y perfil
- [ ] Verificar que todos los componentes usen paleta dorado/negro



## Gestión de Links de Pago y Confirmación v12
- [x] Schema DB: tabla payment_links (id, eventId, url, createdBy, createdAt, updatedAt, isActive)
- [x] Schema DB: tabla payment_link_clicks (id, paymentLinkId, userId, clickedAt, ipAddress)
- [x] Schema DB: tabla payment_confirmations (id, userId, eventId, screenshotUrl, status, confirmedAt, reviewedBy, reviewedAt)
- [x] Admin: panel para actualizar link de pago (input URL, guardar cambios)
- [x] Router tRPC: 8 endpoints para pagos (trackClick, getLink, updateLink, getClicks, submitConfirmation, getConfirmations, approveConfirmation, rejectConfirmation)
- [x] Admin: historial de links de pago (fecha, URL, quién lo cambió)
- [x] Admin: ver quién clickeó el link de pago (usuario, fecha, hora)
- [x] Admin: dashboard de confirmaciones de pago (pendientes, aprobadas, rechazadas)
- [x] Admin: poder aprobar/rechazar confirmaciones de pago
- [x] Usuario: interfaz para enviar screenshot de comprobante de pago
- [ ] Usuario: ver estado de su confirmación de pago
- [ ] Notificación: alertar a admin cuando usuario envía comprobante

## Protección y Seguridad v12
- [x] Deshabilitar screenshots en toda la app (expo-screen-capture) - hook useSecurity
- [x] Bloquear compartir links de WhatsApp, Telegram, etc - hook useSecurity
- [x] Bloquear copiar texto sensible (links de pago) - hook useSecurity
- [ ] Verificar que solo usuarios autenticados accedan a la app
- [ ] Encriptar URLs de pago en tránsito
- [x] Validar que solo admins puedan ver confirmaciones de pago - validación en tRPC

## Restructuración Panel de Admin v13
- [x] Crear sidebar lateral con navegación para admin
- [x] Crear componente HamburgerButton para abrir sidebar
- [x] Integrar sidebar en pantalla de Productos VIP
- [x] Integrar sidebar en pantalla de Links de Pago
- [x] Crear CRUD de productos VIP en admin (ya existe)
- [x] Integrar visualización de pedidos VIP en admin
- [x] Asegurar que link de pago aparezca en pantalla de compra de boletos
- [x] Separar catálogo VIP persistente de pedidos de usuarios
- [x] Asegurar que productos VIP creados aparezcan en pantalla de usuario
- [x] Admin puede editar y borrar productos VIP existentes
- [x] Admin puede ver todos los pedidos VIP de usuarios
- [x] Reemplazar pestañas inferiores por navegación lateral uniforme en todas las pantallas de administración
- [x] Quitar las acciones de WhatsApp y compartir del QR para evitar divulgar accesos privados
- [x] Registrar el clic del miembro antes de abrir el link de pago configurado por el administrador

## Operación de Pagos y Pedidos v14
- [x] Alertar de inmediato al panel administrativo cuando llegue un comprobante de pago
- [x] Añadir un indicador de comprobantes pendientes en el menú administrativo
- [x] Filtrar pedidos VIP por fecha dentro del panel administrativo
- [x] Exportar todos los pedidos VIP filtrados a un archivo CSV
- [x] Mostrar en el perfil del usuario el estado de revisión de sus comprobantes
- [x] Validar los flujos de alertas, filtros, exportación y estado de comprobantes

## Operación del entorno
- [x] Reducir el consumo de Metro y recuperar la previsualización web de desarrollo

## Resiliencia y optimización v15
- [x] Añadir estados de carga, error y reintento en el panel administrativo
- [x] Incorporar indicador de arranque para la primera carga de la aplicación
- [x] Retirar rutas Firebase heredadas que no pertenecen a la navegación activa
- [x] Eliminar dependencias Firebase sin referencias activas y validar el bundle

## Resiliencia y limpieza v16
- [x] Retirar rutas de perfil heredadas que no estén enlazadas
- [x] Añadir reintento automático y aviso de conexión al panel administrativo
- [x] Crear pruebas de interfaz para carga, error y reintento

## Corrección de compilación Android
- [x] Diagnosticar y corregir el fallo de instalación de dependencias en EAS Android

## Continuidad sin conexión v17
- [x] Guardar en caché los datos administrativos esenciales para uso sin conexión
- [x] Mostrar una pantalla de estado sin conexión con los datos disponibles en caché
- [x] Aplicar una transición suave entre la carga inicial y el contenido principal
- [x] Validar los flujos de caché y preparar la siguiente compilación Android

## Sincronización y chat v18
- [x] Guardar en una cola local los cambios de pedido que no se puedan enviar
- [x] Enviar automáticamente la cola al recuperar conexión o reactivar la aplicación
- [x] Enviar push a destinatarios autorizados cuando llegue un mensaje de chat general
- [x] Configurar los módulos nativos y validar los flujos de sincronización y chat

## Navegación de notificaciones v19
- [x] Abrir el chat general al tocar una notificación push de mensaje
- [x] Validar la navegación y preparar una compilación para pruebas físicas

## Experiencia de recepción de chat v20
- [x] Mostrar un banner interno cuando llegue un mensaje mientras la aplicación está activa
- [x] Mostrar un contador de mensajes no leídos en el acceso al chat general
- [x] Resaltar el mensaje recibido al abrir el chat desde una notificación push
- [x] Validar los avisos, contador y resaltado de mensajes
