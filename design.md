# VIP Events App — Design Document

## Brand Identity

**App Name:** VIP Events  
**Tagline:** Tu acceso exclusivo al mundo VIP  
**Color Palette:**
- **Gold / Dorado:** `#C9A84C` — Color primario VIP, botones, acentos
- **Negro profundo:** `#0A0A0A` — Fondo principal (dark mode)
- **Champagne:** `#F5E6C8` — Texto principal sobre fondo oscuro
- **Gris oscuro:** `#1A1A1A` — Superficies/tarjetas
- **Gris medio:** `#2A2A2A` — Bordes, separadores
- **Blanco roto:** `#F0EAD6` — Texto secundario
- **Rojo VIP:** `#C0392B` — Errores, alertas
- **Verde éxito:** `#27AE60` — Confirmaciones

## Screen List

1. **Splash / Onboarding** — Pantalla de bienvenida con logo VIP y botón de acceso
2. **Login / Auth** — Autenticación OAuth con Manus
3. **Home (Usuario)** — Dashboard principal con eventos destacados, próximos eventos y accesos rápidos
4. **Calendario de Eventos** — Vista mensual/semanal de todos los eventos disponibles
5. **Detalle de Evento** — Información completa: fecha, lugar, precio, descripción, mapa
6. **Mi QR** — Código QR personal del usuario (llave de acceso al evento)
7. **Pago / Checkout** — Plataforma de pago con link de MercadoPago
8. **Mis Tickets** — Historial de entradas compradas y activas
9. **Pedidos VIP** — Menú de 5 artículos de servicio VIP para pedir durante el evento
10. **Notificaciones** — Centro de notificaciones en tiempo real
11. **Perfil** — Datos del usuario, configuración, historial
12. **Admin — Dashboard** — Panel de control para el administrador
13. **Admin — Escáner QR** — Cámara para escanear QR de invitados
14. **Admin — Gestión de Invitados** — Lista de invitados, estados de acceso
15. **Admin — Crear Evento** — Formulario para crear/editar eventos
16. **Admin — Enviar Notificación** — Enviar notificaciones push a usuarios

## Primary Content and Functionality

### Home (Usuario)
- Banner del próximo evento con cuenta regresiva
- Tarjeta de acceso rápido "Mi QR"
- Lista de eventos próximos (cards horizontales)
- Sección de notificaciones recientes
- Acceso rápido a Pedidos VIP

### Calendario de Eventos
- Vista de calendario mensual con días marcados
- Lista de eventos del mes seleccionado
- Filtros por categoría/precio
- Indicador de eventos ya pagados

### Detalle de Evento
- Imagen de portada del evento
- Nombre, fecha, hora, ubicación
- Descripción completa
- Precio (500 pesos barra libre)
- Botón "Pagar con MercadoPago"
- Mapa con ubicación e indicaciones
- Contador de invitados (30-40 cupos)

### Mi QR
- Código QR grande y legible
- Nombre del usuario
- Evento al que aplica
- Estado: Activo / Usado / Expirado
- Botón para compartir QR

### Pedidos VIP (5 artículos)
1. Botella de champagne
2. Tabla de quesos y embutidos
3. Cóctel especial de la casa
4. Servicio de mesa privada
5. Fotografía profesional del evento

### Panel Admin
- Estadísticas: total invitados, asistentes, pagos
- Acceso rápido al escáner QR
- Lista de eventos activos
- Botón enviar notificación masiva

### Escáner QR (Admin)
- Cámara en tiempo real
- Resultado inmediato: nombre, foto, estado
- Marcar como "ingresado"
- Historial de escaneos del día

## Key User Flows

### Flujo Usuario — Comprar Entrada
1. Home → Toca evento destacado
2. Detalle de Evento → Lee información
3. Toca "Pagar con MercadoPago"
4. Abre link de MercadoPago (WebBrowser)
5. Completa pago externo
6. Regresa a app → Ticket confirmado
7. Mi QR → QR generado y listo

### Flujo Usuario — Día del Evento
1. Recibe notificación push con ubicación
2. Abre notificación → Pantalla de ubicación con mapa
3. Llega al evento → Muestra Mi QR
4. Admin escanea QR → Acceso confirmado
5. Dentro del evento → Pedidos VIP disponibles
6. Selecciona artículos → Confirma pedido

### Flujo Admin — Gestión de Acceso
1. Abre panel Admin
2. Toca "Escanear QR"
3. Apunta cámara al QR del invitado
4. Ve datos del invitado en pantalla
5. Confirma ingreso → Marca como asistido
6. Continúa con siguiente invitado

### Flujo Admin — Enviar Notificación
1. Panel Admin → "Nueva Notificación"
2. Escribe título y mensaje
3. Selecciona evento destino
4. Toca "Enviar a todos los invitados"
5. Confirmación de envío

## Navigation Structure

```
Tab Bar (Usuario):
├── 🏠 Home
├── 📅 Eventos  
├── 🎫 Mi QR
├── 🍾 VIP
└── 👤 Perfil

Tab Bar (Admin):
├── 📊 Dashboard
├── 📷 Escanear
├── 👥 Invitados
├── 📢 Notificar
└── ⚙️ Gestión
```

## Design Language

- **Estética:** Lujo oscuro (dark luxury) — fondo negro, acentos dorados
- **Tipografía:** Fuentes con serifas para títulos, sans-serif para cuerpo
- **Bordes:** Redondeados (12-16px) con bordes dorados sutiles
- **Sombras:** Glow dorado sutil en elementos activos
- **Iconografía:** Líneas finas, estilo premium
- **Animaciones:** Transiciones suaves 200-300ms, sin rebotes
