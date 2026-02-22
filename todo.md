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
