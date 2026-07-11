# Manual de Usuario e Instalación — Myku Gym

Bienvenido al **Manual de Usuario y Guía de Instalación de Myku Gym**. Este documento describe detalladamente la configuración técnica de la plataforma y el funcionamiento de sus flujos para **Clientes** e **Instructores**.

La plataforma está diseñada con un enfoque *mobile-first*, garantizando una excelente experiencia en dispositivos móviles, y es totalmente responsiva para navegadores de escritorio.

---

## 📌 Tabla de Contenidos
1. [Guía de Instalación y Configuración](#1-guía-de-instalación-y-configuración)
2. [Estructura de Navegación y Rutas](#2-estructura-de-navegación-y-rutas)
3. [Guía del Cliente (Flujo Público)](#3-guía-del-cliente-flujo-público)
4. [Flujo de Asistencia del Cliente (Check-in Móvil)](#4-flujo-de-asistencia-del-cliente-check-in-móvil)
5. [Guía del Instructor (Portal Privado)](#5-guía-del-instructor-portal-privado)
6. [Explicación de Funcionalidades y Reglas de Negocio](#6-explicación-de-funcionalidades-y-reglas-de-negocio)
7. [Preguntas Frecuentes y Soporte](#7-preguntas-frecuentes-y-soporte)

---

## 1. Guía de Instalación y Configuración

Sigue estos pasos para desplegar y ejecutar Myku Gym en tu entorno local de desarrollo.

### Prerrequisitos
- **Node.js:** Versión 18.0.0 o superior instalada.
- **Base de datos:** Cuenta en [Supabase](https://supabase.com/).

### Paso 1: Clonar el Repositorio
```bash
git clone https://github.com/angiejimenez29/myko-gym.git
cd myko-gym
```

### Paso 2: Instalar Dependencias
El proyecto utiliza Next.js 16 (App Router) con React 19 y Tailwind CSS v4. Instala todas las dependencias necesarias ejecutando:
```bash
npm install
```

### Paso 3: Configurar Variables de Entorno
Crea un archivo `.env` (o `.env.local`) en la raíz del proyecto con la configuración de tu instancia de Supabase y servicios adicionales:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key (opcional para acciones administrativas)
```

### Paso 4: Preparar la Base de Datos (Supabase)
Ejecuta los scripts de migración ubicados en la carpeta `supabase/migration/` en el editor SQL de tu panel de Supabase. El orden sugerido de ejecución es:
1. Definición de tablas base (`02_tables_definition.sql`).
2. Índices de rendimiento (`03_performance_indexes.sql`).
3. Datos semilla iniciales (`07_seed_data.sql`).
4. Estructura y permisos del panel del instructor (`10_instructor_panel.sql`).

### Paso 5: Iniciar el Servidor de Desarrollo
Para correr la plataforma localmente en tu computadora:
```bash
npm run dev
```
Abre tu navegador en [http://localhost:3000](http://localhost:3000) para ver la interfaz pública.

---

## 2. Estructura de Navegación y Rutas

La plataforma organiza sus pantallas de manera modular a través del App Router de Next.js:

### 🌐 Rutas Públicas (Clientes)
- `/` - **Página de Inicio:** Landing page con clases destacadas e información del gimnasio.
- `/clases` - **Catálogo:** Buscador y filtros de todas las sesiones activas programadas.
- `/reserva/[id]` - **Detalle de Clase:** Descripción completa, ubicación y botón para iniciar reserva.
- `/reserva/[id]/espacio` - **Distribución:** Selección gráfica de asientos e ingreso de datos.
- `/reserva/[id]/pago` - **Simulador de Pago:** Resumen de compra y pasarela de pago segura con Mercado Pago.
- `/reserva/[id]/confirmacion` - **Comprobante:** Pantalla de confirmación con detalles y código QR.
- `/checkin` - **Asistencia del Alumno:** Portal móvil de auto-registro escaneando el código QR.

### 🔐 Rutas Privadas (Instructores)
- `/login` - **Acceso:** Portal seguro de autenticación.
- `/panel` - **Panel Principal:** Dashboard con listado de sesiones, estadísticas y accesos directos.
- `/panel/nueva-sesion` - **Creación:** Formulario para programar nuevas clases.
- `/panel/clase/[id]` - **Detalle del Instructor:** Visualización avanzada de la clase y sus reservas.
- `/panel/clase/[id]/editar` - **Edición:** Modificación de campos de la sesión.
- `/panel/asistencia` - **Listado de Clases:** Buscador de sesiones activas para pase de lista.
- `/panel/asistencia/[id]` - **Monitoreo en Vivo:** Cuadrícula interactiva en tiempo real y descarga de QR de clase.
- `/panel/devoluciones` - **Reembolsos:** Listado de cancelaciones para liberación de aforo.

---

## 3. Guía del Cliente (Flujo Público)

### 3.1 Descubrimiento de Clases
El cliente accede a la página de inicio o a la pestaña **Clases** para ver el catálogo de sesiones programadas.
- *Insertar captura de pantalla del Catálogo de Clases aquí*
- Cada sesión muestra el tipo de clase, nombre del instructor, temática, precio, fecha y hora oficial de Lima y los cupos restantes disponibles.

### 3.2 Selección de Asientos y Datos
Una vez seleccionada una clase, el cliente procede al plano interactivo de la sala:
- *Insertar captura de pantalla de la Distribución de Asientos aquí*
- Hace clic sobre los cuadros de espacios disponibles (marcados en color **Verde**) y estos pasarán a color **Amarillo** (Seleccionados).
- Introduce su **Nombre Completo** y **Número de Celular**.

### 3.3 Pago y Confirmación
- El sistema muestra el resumen del cobro y los espacios seleccionados.
- Se pulsa el botón seguro de Mercado Pago.
- El cliente es redirigido a la pasarela de Mercado Pago para procesar el pago con Tarjeta de Crédito, Débito, PagoEfectivo o Yape.
- Una vez procesado el pago e informada la plataforma vía webhook, se muestra la pantalla de confirmación de la reserva.
- *Insertar captura de pantalla de la Confirmación de Reserva aquí*

---

## 4. Flujo de Asistencia del Cliente (Check-in Móvil)

> [!NOTE]
> *Este flujo se encuentra en proceso de perfeccionamiento en el código y representa la experiencia final planeada para el alumno.*

Este módulo permite al cliente registrar su ingreso al gimnasio utilizando su propio teléfono móvil sin requerir intervención directa del personal en recepción.

### Paso 1: Escaneo del Código QR de la Clase
Al llegar al gimnasio, el cliente se dirige al punto de ingreso donde se proyecta o está impreso el código QR generado por el instructor. El cliente escanea el QR con la cámara de su celular.
- *Insertar captura de la zona de ingreso con el código QR aquí*

### Paso 2: Ingresar al Portal de Asistencia
El código QR redirige al cliente a la página web móvil `/checkin`:
- *Insertar captura de pantalla de la Vista de Auto Check-In móvil aquí*
- La pantalla solicitará al alumno ingresar su **Número de celular** (con el que se registró al realizar la reserva).

### Paso 3: Selección de Clase Activa
Al validar el celular, el portal mostrará el listado de clases que el alumno tiene reservadas para la fecha actual:
- *Insertar captura de pantalla del Listado de Clases del Alumno aquí*
- El cliente selecciona la clase a la cual está ingresando en ese momento.

### Paso 4: Confirmación del Check-in
- Al presionar el botón **"Confirmar Asistencia"**, el sistema asocia el espacio reservado del alumno y lo marca inmediatamente como **Presente** (asiento en color **Verde Neón** en el panel del profesor).
- La pantalla del móvil del cliente mostrará un mensaje de éxito: *"¡Asistencia Registrada! Disfruta tu clase"*.
- *Insertar captura de pantalla del Mensaje de Éxito en Auto Check-in aquí*

---

## 5. Guía del Instructor (Portal Privado)

### 5.1 Dashboard del Instructor
Al iniciar sesión con sus credenciales, el instructor ingresa al Panel de Control:
- *Insertar captura de pantalla del Panel del Instructor (Dashboard) aquí*
- En la parte superior visualiza la **Próxima Clase** con la ocupación en tiempo real (ej. `18 / 30`).
- Puede acceder al listado completo de sus clases ordenadas cronológicamente.

### 5.2 Programación de Nueva Clase
Para crear una sesión, el instructor pulsa el botón rosa flotante `+`:
- *Insertar captura de pantalla del Formulario de Programar Nueva Sesión aquí*
- Llena los campos requeridos (Fecha, Hora, Especialidad, Costo, Capacidad).
- El campo **"Número Vinculado"** se auto-completa automáticamente con el celular guardado en su perfil, ahorrando tiempo de digitación. No obstante, el instructor puede modificarlo en caso de requerir un contacto alternativo para esa clase.
- Los campos opcionales muestran placeholders tenues (ej. *"Ej. Ashly Gutierrez"*) para no confundirse con datos completados.

### 5.3 Monitoreo en Vivo
Al entrar al visor de asistencia de una clase, el instructor tiene control absoluto de la sala:
- *Insertar captura de pantalla del Monitoreo en Vivo y pase de lista aquí*
- **Generador de QR:** Al pulsar en *"Visualizar QR de las clases"*, se genera el QR que los alumnos escanearán. El instructor puede descargar esta imagen para imprimirla.
- **Pase de Lista Manual:** El instructor puede ver a los alumnos reservados (color **Morado**). Si un alumno no puede usar el check-in móvil, el instructor hace clic sobre su asiento, visualiza sus datos y presiona *"Confirmar Asistencia"* para cambiar el estado a **Verde Neón** manualmente.

### 5.4 Gestión de Devoluciones
Si una clase se cancela o un alumno solicita reembolso:
- *Insertar captura de pantalla del Buzón de Devoluciones aquí*
- El instructor busca el nombre del alumno y marca el botón *"Completar Devolución"*.
- Esto libera de inmediato el espacio en la sala, permitiendo que otro cliente adquiera ese cupo desde el catálogo público.

---

## 6. Explicación de Funcionalidades y Reglas de Negocio

### Lógica de Expiración de Clases (Zona Horaria America/Lima)
Para evitar discrepancias entre el servidor (que en entornos como Vercel se fuerza a UTC) y la ubicación real del negocio (Perú, UTC-5), el sistema implementa un algoritmo de conversión explícita:
- La hora actual se convierte usando el estándar `Intl.DateTimeFormat` configurado en `America/Lima`.
- Las clases programadas para hoy se descartan automáticamente del catálogo público exactamente **1 hora después de su hora de inicio**. 
- Esta comparación es independiente de la zona horaria del servidor de alojamiento o del navegador del usuario.

### Gestión de Capacidad y Grillas de Sala
- El instructor puede fijar aforos desde 1 hasta un máximo de 40 alumnos.
- La cuadrícula interactiva de selección de asientos se adapta automáticamente para renderizar solo la cantidad de cuadros definida como capacidad, manteniendo la consistencia visual y evitando que los clientes elijan asientos inexistentes.

### Gestión Manual de Reembolsos
- Las devoluciones monetarias se gestionan de forma externa al software (por ejemplo, realizando una transferencia o yapeo manual al cliente usando la información de la reserva). El panel del instructor sirve para actualizar el aforo digital del sistema y liberar la reserva.

---

## 7. Preguntas Frecuentes y Soporte

**¿Cómo funciona el QR de Clase para el check-in automático?**
El código QR codifica de forma única la ruta `/checkin`. Cuando los alumnos lo escanean, el portal móvil busca las reservas hechas con su número de teléfono celular para el día de hoy, y les permite confirmar su ingreso con un solo clic.

**¿Qué pasa si deseo cambiar el aforo de una clase ya publicada?**
Puedes editar el aforo desde la pantalla de edición, siempre y cuando el nuevo número de capacidad no sea inferior al número de asientos que ya han sido reservados y pagados por los alumnos.

**¿Las cancelaciones de clase avisan a los alumnos?**
Sí, en el flujo completo planeado, la Server Action de cancelación de sesión actualiza el estado de la clase y dispara eventos de notificación utilizando el teléfono de contacto registrado.

---
*Fin del Manual de Usuario y Guía de Instalación.*
