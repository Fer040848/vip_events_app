# Notas de implementación: sincronización y notificaciones

La sincronización de cambios pendientes se ejecutará de inmediato al recuperar la conectividad mientras la aplicación está activa. También se registrará una tarea nativa diferible para intentarlo posteriormente; el sistema operativo decide el momento de ejecución y, en Android, el intervalo mínimo es de 15 minutos. Por ello no se debe presentar como una garantía de entrega inmediata cuando la aplicación está cerrada.

Las tareas nativas se deben definir en el ámbito global y devolver explícitamente éxito o fallo. La configuración nativa de iOS requiere habilitar el modo de procesamiento cuando se use una tarea de segundo plano.

Las notificaciones push de chat requieren permisos, un canal Android y un token Expo registrado en el servidor. En Android con SDK 53 o superior, el push remoto requiere una compilación de desarrollo o publicación; Expo Go no basta. Las notificaciones en primer plano requieren un manejador que solicite banner y lista visibles.

## Referencias

- Expo SDK 54, `background/background-task/DOCS.md`.
- Expo SDK 54, `background/notifications/DOCS.md`.
