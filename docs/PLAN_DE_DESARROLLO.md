# Plan de Desarrollo a Nivel de Archivo — Meikyo Gym (MVP)

Este documento detalla a nivel técnico y estructural cada actividad requerida para la construcción de la plataforma, especificando los archivos clave que serán creados o modificados en cada paso.

---

## Actividad 1: Setup del Proyecto y Sistema de Diseño
**Objetivo:** Establecer la base del proyecto en Next.js (App Router) y configurar los tokens visuales extraídos de los mockups (Dark Mode, gradientes, glassmorphism).

**Archivos a modificar/crear:**
- [x] `tailwind.config.ts`: Configurar colores (fondos `#0B0914`, contenedor `#151226`), gradientes primarios (`from-pink-500 to-purple-600`), colores de estado (verde neón, rosa/magenta, amarillo glow), y fuentes personalizadas. *(Implementado en globals.css)*
- [x] `src/app/globals.css`: Aplicar fondos oscuros globales, variables CSS base y animaciones genéricas.
- [x] `src/app/layout.tsx`: Configurar la fuente (ej. `Inter`), meta tags base y el contenedor principal de la aplicación.
- [x] `package.json`: Añadir dependencias base (`lucide-react` para iconos, `clsx` y `tailwind-merge` para utilidades de clases).

---

## Actividad 2: Integración Base de Supabase
**Objetivo:** Configurar la conexión con el backend asaaS para base de datos y autenticación (Server y Client components).

**Archivos a crear:**
- [x] `lib/supabase/client.ts`: Instancia de Supabase para Client Components.
- [x] `lib/supabase/server.ts`: Instancia de Supabase para Server Components y Route Handlers (utilizando cookies).
- [x] `lib/supabase/middleware.ts`: Middleware de Next.js para proteger las rutas del instructor.
- [x] `types/database.types.ts`: Tipos generados a partir de las tablas SQL (instructors, sessions, spots, reservations, etc).

---

## Actividad 3: Componentes UI Compartidos (Design System)
**Objetivo:** Crear los ladrillos visuales reutilizables siguiendo los mockups para mantener consistencia.

**Archivos a crear (`src/features/shared/components/`):**
- [x] `Button.tsx`: Botón con variantes (`primary` con gradiente, `secondary` gris, `outline`).
- [x] `Input.tsx`: Campo de texto oscuro con borde morado/gris y label integrado.
- [x] `Card.tsx`: Contenedor base tipo glassmorphism (`bg-[#151226]` con bordes sutiles).
- [x] `TopBar.tsx`: Barra de navegación con botón de volver y títulos (usada en detalle de clase y portal de instructor).
- [x] `Badge.tsx`: Pequeñas etiquetas (ej. para "Entrenador Certificado").

---

## Actividad 4: Portal Público — Landing y Catálogo
**Objetivo:** Desarrollar las vistas para que el cliente descubra las clases disponibles.

**Archivos a crear:**
- [x] `app/(public)/layout.tsx`: Layout con el Header público (Logo Meikyo Gym).
- [x] `app/(public)/page.tsx`: Landing Page. Consumirá `sessions` de Supabase donde `is_featured = true`.
- [x] `app/(public)/clases/page.tsx`: Catálogo completo de clases futuras.
- [x] `features/classes/components/ClassCard.tsx`: Tarjeta vertical de la sesión (Fecha, hora, instructor, temática, barra de progreso de cupos).
- [x] `features/classes/components/InstructorProfile.tsx`: Componente "Conoce a tu Instructor" con botón verde de WhatsApp.
- [x] `features/classes/components/HowItWorks.tsx`: Sección informativa (banner o tarjetas) aclarando que el cliente no necesita crear cuenta para reservar (sólo nombre y celular), mientras que los instructores tienen su propio portal.

**Notas UX (Evaluación Heurística):**
- **Landing y Catálogo:** Simplificar tarjetas de sesión para evitar saturación visual, destacar el precio de manera clara y añadir filtros (por fecha o instructor).
- **Visibilidad de estado:** Crear estados de urgencia (ej. "Últimos cupos") en el catálogo de clases.

---

## Actividad 5: Portal Público — Reserva y Pago
**Objetivo:** Implementar el flujo de selección de espacios y pago simulado.

**Archivos a crear:**
- [ ] `src/app/(public)/reserva/[id]/page.tsx`: Vista de detalles de la sesión.
- [ ] `src/features/booking/components/LocationMap.tsx`: Componente de Leaflet para mostrar el mapa embebido.
- [ ] `src/app/(public)/reserva/[id]/espacio/page.tsx`: Vista de "Selecciona tu Espacio".
- [ ] `src/features/booking/components/SpaceGrid.tsx`: Grilla interactiva. Genera los cuadrados (1 al 40) mapeando la tabla `session_spots`. Estados: Verde (libre), Rosa (ocupado), Amarillo (seleccionado localmente).
- [ ] `src/features/booking/components/BookingForm.tsx`: Formulario inferior de Nombre Completo y Celular.
- [ ] `src/app/(public)/reserva/pago/page.tsx`: Vista "Pago con Yape".
- [ ] `src/features/booking/actions/createReservation.ts`: Server Action que inserta en `reservations`, `reservation_spots` y `payments` de forma transaccional.
- [ ] `src/app/(public)/reserva/confirmacion/page.tsx`: Vista de éxito con el check naranja.

**Notas UX (Evaluación Heurística):**
- **Reserva:** Comunicar claramente cómo deseleccionar un asiento elegido y renombrar "INSTRUCTOR / ESPEJO" en el mapa por un término más intuitivo.
- **Pago y Validaciones:** Implementar validaciones en tiempo real (formato de celular, número de Yape, código). Mostrar mensajes de error claros si faltan datos o hay fallos de red.
- **Control y Ayuda:** Habilitar la opción de editar/cancelar la reserva antes de confirmar. Añadir guía visual sobre cómo obtener el código Yape y destacar las políticas de cancelación.
- **Consistencia Visual:** Unificar el color del botón "Yapear" (fucsia) y mantener el header morado-fucsia en la confirmación en lugar del naranja.

---

## Actividad 6: Portal Privado — Autenticación y Dashboard
**Objetivo:** Habilitar el acceso seguro para instructores y su vista principal.

**Archivos a crear:**
- [ ] `src/app/(auth)/login/page.tsx`: Formulario de acceso con email y contraseña. Llama a `supabase.auth.signInWithPassword()`.
- [ ] `src/app/instructor/layout.tsx`: Layout privado. Verifica sesión válida, de lo contrario redirige a `/login`.
- [ ] `src/app/instructor/page.tsx`: Dashboard ("Panel de Control").
- [ ] `src/features/instructor/components/NextClassWidget.tsx`: Tarjeta destacada de "Próxima Clase" con botón "Ver Asistencia en Vivo".
- [ ] `src/features/instructor/components/UpcomingSessionsList.tsx`: Listado resumido de clases futuras con botón flotante rosa `+`.

**Notas UX (Evaluación Heurística):**
- **Autenticación (Login):** Mostrar mensajes de error específicos ante credenciales incorrectas, comunicar requisitos básicos de validación (correo/contraseña), agregar feedback visual (spinner de carga) al botón de login, y unificar fondo a *dark navy*.
- **Recuperación de contraseña:** Explicar claramente el proceso y el tiempo estimado para recibir el correo de recuperación.
- **Dashboard y Onboarding:** Incluir accesos rápidos a estadísticas o historiales de asistencia. Mostrar la temática/invitado especial en la lista de próximas sesiones para dar contexto sin entrar al detalle. Implementar una guía inicial (onboarding) para instructores nuevos.

---

## Actividad 7: Portal Privado — Gestión de Clases y Asistencia
**Objetivo:** Permitir al instructor crear clases y gestionar los check-ins.

**Archivos a crear:**
- [ ] `src/app/instructor/nueva-sesion/page.tsx`: Vista "Programar Nueva Sesión".
- [ ] `src/features/instructor/components/CreateSessionForm.tsx`: Formulario con validación (DatePicker, TimePicker, Inputs básicos).
- [ ] `src/features/instructor/actions/publishSession.ts`: Server action que inserta la sesión e inicializa los registros en `session_spots` basados en la capacidad.
- [ ] `src/app/instructor/clase/[id]/page.tsx`: Vista "Asistencia en Vivo".
- [ ] `src/features/instructor/components/InstructorAttendanceGrid.tsx`: Grilla de vista instructor (Blanco = Libre, Rosa = Reservado, Verde = Presente).
- [ ] `src/features/instructor/components/CheckInModal.tsx`: Modal rojo oscuro que aparece al tocar un espacio reservado para hacer "Check-in Manual".
- [ ] `src/features/instructor/components/QrGenerator.tsx`: Modal de pantalla completa mostrando el código QR (utilizando librería `qrcode.react`) para el auto check-in de clientes.

**Notas UX (Evaluación Heurística):**
- **Creación de clases:** Añadir campo visual de `capacidad`, restringir valores inválidos/negativos en el campo de costo y brindar ayuda contextual (ej. en "Temática del Día"). Proveer una vista previa de la clase antes de publicarla y mostrar confirmaciones visibles de éxito al crearla. Estandarizar el estilo del botón "Cancelar".
- **Control (Instructor):** Permitir editar/cancelar clases publicadas y dar la posibilidad de revertir una asistencia manual marcada por error.
- **Check-in y Asistencia:** Eliminar el valor técnico "Null" en el modal de check-in y rediseñarlo para evitar espacios vacíos amplios. Optimizar el check-in manual para que no sea repetitivo (confirmación múltiple) en grupos grandes. Asegurarse de que los contadores de asistencia sean únicos, usando íconos intuitivos.
