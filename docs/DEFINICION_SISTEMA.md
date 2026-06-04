# Definición del Sistema — Meikyo Gym

## 1. Visión General

Meikyo Gym es una plataforma web mobile-first que permite a clientes reservar espacios en clases de fitness, y a instructores gestionar sus sesiones, reservas y asistencia. El sistema está diseñado como MVP con dos roles principales: **Cliente** e **Instructor**.

---

## 2. Roles del Sistema

### 2.1 Cliente
- No crea cuenta ni inicia sesión.
- Se registra implícitamente al realizar una reserva (nombre + número de celular).
- Puede realizar múltiples reservas en distintas transacciones.
- Puede reservar más de un espacio en una sola transacción.

### 2.2 Instructor
- Accede mediante email y contraseña (portal privado).
- Crea y gestiona sus propias clases/sesiones.
- Visualiza reservas y asistencia en tiempo real.
- Puede realizar check-in manual y gestionar devoluciones.

> No hay rol de administrador en el MVP. Cada instructor gestiona únicamente sus propias clases.

---

## 3. Módulos del Sistema

### 3.1 Landing Page Pública (Vista Cliente)

**Propósito:** Punto de entrada para que los clientes descubran y reserven clases.

**Funcionalidades:**
- Listado de clases disponibles con: fecha, hora, instructor, temática del día, cupos libres restantes.
- Sección "Conoce a tu Instructor" con perfil, experiencia y contacto WhatsApp.
- Sección de ubicación con dirección, teléfono y email.
- Navegación hacia el detalle de cada clase.

**Datos mostrados por clase:**
- Fecha y hora
- Instructor asignado
- Temática del día (ej: "Turquesa y Negro")
- Invitado especial (opcional)
- Cupos libres del total definido por el instructor

---

### 3.2 Detalle de Clase (Vista Cliente)

**Propósito:** Mostrar información completa de una sesión antes de reservar.

**Funcionalidades:**
- Fecha, hora, instructor con badge de certificación.
- Ubicación con mapa embebido.
- Precio por persona (en soles).
- Barra de progreso de cupos disponibles (ej: 10 de 30).
- Botón "Continuar a la Reserva".

**Regla de negocio:**
- No se aceptan cancelaciones una vez realizado el pago.

---

### 3.3 Selección de Espacio (Vista Cliente)

**Propósito:** Permitir al cliente elegir su(s) espacio(s) en el mapa de la planta del gimnasio.

**Funcionalidades:**
- Mapa visual de espacios numerados (hasta 40 máximo), grilla dinámica según capacidad definida por el instructor.
- Estados de espacio: disponible (verde), ocupado (rojo), seleccionado (amarillo).
- Referencia visual de instructor/espejo al frente.
- Selección de uno o más espacios en una sola transacción (sin límite en MVP).
- Formulario con: Nombre Completo y Número de Celular.
- Botón "Continuar al Pago".

**Reglas de negocio:**
- Los espacios ocupados no son seleccionables.
- El cliente ingresa sus datos una vez por transacción, aunque reserve múltiples espacios.

---

### 3.4 Pago (Vista Cliente)

**Propósito:** Procesar el pago de la reserva.

**Funcionalidades:**
- Resumen de la reserva (espacio(s), nombre, celular, instructor, día/hora, temática).
- Pago mediante **Yape** (integrado vía Culqi).
- Campos: número de celular Yape + código de aprobación.
- Monto total = precio por persona × cantidad de espacios seleccionados.
- Botón "Yapear S/. X.XX".

**Integraciones:**
- Pasarela de pago: **Culqi** (soporte Yape).
- Notificación post-pago: envío de confirmación por **WhatsApp** al número del cliente.

---

### 3.5 Confirmación de Reserva (Vista Cliente)

**Propósito:** Confirmar al cliente que su reserva fue procesada exitosamente.

**Funcionalidades:**
- Resumen de cada espacio reservado (número de espacio, nombre, celular, instructor, día/hora, temática).
- Mensaje de instrucción: llegar 10 minutos antes y escanear QR en entrada para check-in automático.
- Botón "Volver al Inicio".

---

### 3.6 Portal de Instructor — Login

**Propósito:** Autenticación del instructor.

**Funcionalidades:**
- Login con email y contraseña.
- Enlace "¿Olvidaste tu contraseña?" (recuperación por email).

---

### 3.7 Portal de Instructor — Panel de Control

**Propósito:** Vista general del estado actual de las clases del instructor.

**Funcionalidades:**
- **Próxima clase:** fecha, hora, invitada especial, ocupación en tiempo real (ej: 20/30 cupos).
- Barra de progreso de ocupación.
- Botón "Ver Asistencia en Vivo" → navega al módulo de asistencia.
- **Próximas sesiones:** listado con fecha, hora y cupos reservados.
- Botón "+" para crear nueva sesión.

---

### 3.8 Portal de Instructor — Programar Nueva Sesión

**Propósito:** Crear una nueva clase/sesión.

**Campos del formulario:**
| Campo | Tipo | Requerido |
|---|---|---|
| Fecha | Date picker | Sí |
| Hora | Time picker | Sí |
| Capacidad | Número (1–40) | Sí |
| Invitado Especial | Texto | No |
| Temática del Día | Texto | No |
| Costo (S/.) | Número | Sí |
| WhatsApp de Contacto | Teléfono | Sí |

**Acciones:** Publicar Clase / Cancelar.

**Reglas de negocio:**
- Al publicarse, la clase aparece inmediatamente en la landing pública.
- El instructor define la capacidad al crear la sesión (mínimo 1, máximo 40).
- La capacidad no es editable una vez que hay reservas activas.

---

### 3.9 Portal de Instructor — Asistencia en Vivo

**Propósito:** Gestionar la asistencia de una clase en tiempo real.

**Funcionalidades:**
- Contadores en tiempo real: Presentes / Reservados / Libres.
- Mapa visual de la planta con tres estados:
  - ⬜ Libre/disponible
  - 🟣 Reservado (pago verificado)
  - 🟢 Alumno presente (check-in realizado)
- Generación de **QR de Clase** para check-in automático de alumnos al llegar.
- Al tocar un espacio → modal con detalle del alumno y opción de **Check-in Manual**.

**Check-in Manual:**
- Para alumnos que pagaron en efectivo u otros medios fuera del sistema.
- El instructor marca el espacio como "presente" manualmente.

**QR de Clase:**
- Código único por sesión (ej: `MEIKYO-CLASS-1-CHECKIN`).
- Los alumnos lo escanean al llegar para registrar su asistencia automáticamente.

---

### 3.10 Devoluciones (Vista Instructor)

**Propósito:** Gestionar reembolsos de reservas.

**Funcionalidades (MVP — proceso manual):**
- El instructor puede marcar una reserva como "devuelta".
- El espacio vuelve a quedar disponible.
- No hay integración automática con Yape/Culqi para el MVP; el reembolso se gestiona fuera del sistema.

> *Vista específica por definir en siguiente iteración de mockups.*

---

## 4. Entidades Principales

### Instructor
- id, nombre, email, contraseña (hash), teléfono_whatsapp, bio, años_experiencia, foto

### Sesión / Clase
- id, instructor_id, fecha, hora, invitado_especial, tematica, costo, whatsapp_contacto, capacidad (definida por instructor, máx. 40), estado (activa/cancelada)

### Espacio
- id, sesion_id, numero (1–capacidad), estado (libre/reservado/presente)

### Reserva
- id, sesion_id, cliente_nombre, cliente_celular, fecha_reserva, monto_total, estado (confirmada/devuelta)

### Reserva_Espacio (tabla pivot)
- id, reserva_id, espacio_id

### Pago
- id, reserva_id, metodo (yape), referencia_culqi, monto, estado (pagado/devuelto), fecha

---

## 5. Flujos Principales

### Flujo Cliente — Reserva
```
Landing → Detalle de Clase → Selección de Espacio(s) + Datos → Pago Yape → Confirmación + WhatsApp
```

### Flujo Cliente — Check-in
```
Llegada al gym → Escaneo QR → Check-in automático → Espacio marcado como "presente"
```

### Flujo Instructor — Gestión de Clase
```
Login → Panel → Nueva Sesión → Publicar → Ver reservas en tiempo real → Asistencia en Vivo → Check-in manual si aplica
```

### Flujo Instructor — Devolución
```
Login → [Vista devoluciones] → Buscar reserva → Marcar como devuelta → Espacio liberado
```

---

## 6. Integraciones Externas

| Servicio | Propósito |
|---|---|
| **Pago simulado** | Sin integración real en MVP |
| **Notificaciones** | Confirmación de reserva + reminders (método por definir) |
| **Leaflet** | Mapa de ubicación del gym en detalle de clase |
| **QR Generator** | Generación de códigos QR por sesión (check-in) |

---

## 7. Consideraciones Técnicas (MVP)

- Plataforma: **Web mobile-first** (responsive, optimizado para celular).
- Stack: **Next.js** (frontend + API routes), **Supabase** (base de datos + auth + realtime), **Vercel** (deploy).
- Mapa de ubicación: **Leaflet** (reemplaza Google Maps).
- Generación de QR: librería **qr-generator** o equivalente en Node.
- Notificaciones: método por definir (WhatsApp API, email u otro). Se enviarán: confirmación de reserva + reminder 24h antes + reminder 2h antes de la clase.
- Pagos: **simulados** en MVP (sin integración real con Culqi/Yape).
- Sin cuenta de cliente — identificación por nombre + celular.
- Capacidad por clase: definida por el instructor al crear la sesión, máximo global de 40 espacios.
- Devoluciones: proceso manual, sin reverso automático de pago.
- Un instructor gestiona únicamente sus propias clases.
- Múltiples espacios en una transacción: precio × cantidad de espacios.

---

## 8. Fuera del Alcance (MVP)

- Panel de administrador global.
- Historial de reservas para el cliente (sin cuenta).
- Cancelaciones iniciadas por el cliente.
- Pagos reales con Culqi/Yape u otros métodos.
- Reportes y analytics para el instructor.
- App nativa (iOS / Android).
