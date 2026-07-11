# Documentación Técnica del Sistema — Myku Gym

Este documento presenta la estructura, organización, arquitectura y calidad técnica de la plataforma de reservas **Myku Gym**. Sirve como manual técnico de referencia para desarrolladores, arquitectos y administradores de la plataforma.

---

## 📌 Tabla de Contenidos
1. [Introducción y Arquitectura del Sistema](#1-introducción-y-arquitectura-del-sistema)
2. [Modelo de Datos y Base de Datos (BD)](#2-modelo-de-datos-y-base-de-datos-bd)
3. [Flujos del Sistema y Diagramas de Secuencia](#3-flujos-del-sistema-y-diagramas-de-secuencia)
4. [Estructura del Proyecto y Organización de Código](#4-estructura-del-proyecto-y-organización-de-código)
5. [Configuración de Despliegue e Integraciones (Webhooks)](#5-configuración-de-despliegue-e-integraciones-webhooks)
6. [Estrategia de Pruebas y Evidencias de Calidad](#6-estrategia-de-pruebas-y-evidencias-de-calidad)

---

## 1. Introducción y Arquitectura del Sistema

### 1.1 Propósito
El objetivo de Myku Gym es permitir a los clientes realizar reservas ágiles de asientos numerados para clases de baile/fitness y habilitar una consola de monitoreo en tiempo real para instructores.

### 1.2 Arquitectura de Software
La plataforma utiliza una arquitectura moderna serverless y mobile-first:
- **Frontend / Servidor de Aplicaciones:** Next.js (App Router, React 19) alojado en Vercel.
- **Base de Datos & Backend-as-a-Service:** Supabase (PostgreSQL) para almacenamiento relacional, autenticación (Supabase Auth) y eventos en tiempo real (PostgreSQL Replication/Realtime).
- **Pasarela de Pagos:** Integración con **Mercado Pago** utilizando el SDK oficial de Node y notificaciones asíncronas vía Webhooks.
- **Servicio de Notificaciones:** Notificaciones de confirmación automatizadas a través de la API de **Twilio WhatsApp**.

```
*Insertar diagrama de arquitectura de software aquí*
(Ej. Conexión entre cliente, servidor Next.js en Vercel, Supabase DB y APIs externas de Mercado Pago y Twilio)
```

---

## 2. Modelo de Datos y Base de Datos (BD)

El motor de base de datos es PostgreSQL provisto por Supabase. 

### 2.1 Modelo Lógico de BD
```
*Insertar modelo lógico BD aquí*
(Diagrama Entidad-Relación que muestre las tablas, columnas, llaves primarias, foráneas y cardinalidades)
```

### 2.2 Diccionario de Datos

#### Tabla: `instructors`
Almacena la información de los instructores autorizados para dictar clases.
- `id`: UUID (Primary Key, referenciado a `auth.users`).
- `full_name`: VARCHAR (Nombre completo del instructor).
- `whatsapp_phone`: VARCHAR (Teléfono de contacto).
- `years_experience`: INT (Años de experiencia).
- `bio`: TEXT (Biografía corta del instructor).

#### Tabla: `sessions`
Registra las clases programadas en el gimnasio.
- `id`: UUID (Primary Key).
- `instructor_id`: UUID (Foreign Key de `instructors`).
- `session_date`: DATE (Fecha de la clase, zona horaria `America/Lima`).
- `start_time`: TIME (Hora de inicio de la clase).
- `capacity`: INT (Aforo máximo de la clase, 1 a 40).
- `theme`: VARCHAR (Temática de vestimenta o música).
- `special_guest`: VARCHAR (Nombre de instructor invitado).
- `class_type`: VARCHAR (Tipo de disciplina, ej. Salsa, Bachata).
- `price`: NUMERIC (Costo por asiento).
- `whatsapp_contact`: VARCHAR (Teléfono de contacto específico de la clase).
- `status`: VARCHAR (Estado de la clase: `published`, `draft`, `cancelled`).

#### Tabla: `session_spots`
Representa los asientos físicos de la sala vinculados a una clase específica.
- `id`: UUID (Primary Key).
- `session_id`: UUID (Foreign Key de `sessions`).
- `spot_number`: INT (Número de asiento, 1 a `capacity`).
- `status`: VARCHAR (Estado actual del asiento: `available`, `reserved`, `present`).

#### Tabla: `reservations`
Registra las intenciones de reserva e información de pago de los clientes.
- `id`: UUID (Primary Key).
- `session_id`: UUID (Foreign Key de `sessions`).
- `client_name`: VARCHAR (Nombre del cliente).
- `client_phone`: VARCHAR (Número de celular del cliente).
- `total_amount`: NUMERIC (Monto total pagado).
- `estado_pago`: VARCHAR (Estado de Mercado Pago: `pendiente`, `aprobado`, `rechazado`).
- `status`: VARCHAR (Estado de reserva: `confirmed`, `pending`, `refunded`).
- `mp_payment_id`: VARCHAR (ID de transacción de Mercado Pago).
- `expira_en`: TIMESTAMP (Tiempo límite de 10 minutos para pagar la reserva pendiente).

#### Tabla: `reservation_spots`
Tabla pivote que asocia una reserva con uno o más asientos seleccionados.
- `id`: UUID (Primary Key).
- `reservation_id`: UUID (Foreign Key de `reservations`).
- `spot_id`: UUID (Foreign Key de `session_spots`).

---

## 3. Flujos del Sistema y Diagramas de Secuencia

### 3.1 Flujo de Reserva y Pago con Mercado Pago
Describe la interacción cuando un cliente selecciona un asiento, realiza el pago en la pasarela de Mercado Pago y el sistema recibe el webhook asíncrono.

```
*Insertar diagrama de secuencia de compra y pago aquí*
(Interacciones: Cliente -> Navegador -> Server Next.js -> Supabase -> Mercado Pago API/Webhook -> Twilio API)
```

1. **Selección:** El cliente elige los asientos en `/reserva/[id]/espacio`. Se crea una reserva en estado `pendiente` con duración límite de 10 minutos para congelar los asientos.
2. **Pago:** El cliente pulsa el botón de Mercado Pago y es redirigido a su checkout seguro.
3. **Webhook:** Mercado Pago envía un POST a `/api/webhooks/mercadopago`. El servidor procesa el estado del pago:
   - Si es `approved`: Cambia la reserva a `aprobado`, confirma los asientos de la clase a `reserved` y dispara la notificación de confirmación por Twilio WhatsApp.
   - Si es `rejected`/`cancelled`: Libera los asientos a `available` en `session_spots`.

### 3.2 Flujo de Asistencia y Check-in Móvil
Mapea el recorrido del cliente escaneando el código QR en la entrada de la sala.

```
*Insertar diagrama de secuencia de auto-check-in aquí*
(Interacciones: Alumno -> Lector QR -> Portal Móvil /checkin -> API Supabase -> Panel Instructor Realtime)
```

---

## 4. Estructura del Proyecto y Organización de Código

El repositorio sigue un patrón híbrido entre la estructura estándar de Next.js App Router y divisiones por capas de características (**feature-based design**).

```
myko-gym/
├── app/                          # App Router (Rutas de Next.js y APIs)
│   ├── (auth)/                   # Rutas de autenticación
│   ├── (instructor)/             # Panel privado del instructor
│   ├── (public)/                 # Rutas de cara al cliente y reservas
│   └── api/                      # Route Handlers (Webhooks, APIs)
├── components/                   # Componentes visuales genéricos
├── docs/                         # Documentación del sistema
├── features/                     # Lógica de dominio encapsulada por feature
│   ├── auth/                     # Lógica de autenticación
│   ├── booking/                  # Lógica de reservas y Mercado Pago
│   ├── classes/                  # Componentes de visualización de clases
│   ├── instructors/              # Perfiles y tarjetas de instructores
│   └── shared/                   # Componentes reutilizables del Design System
├── lib/                          # Inicializadores y librerías comunes (Supabase client/server)
└── types/                        # Tipados globales de TypeScript y Base de Datos
```

### 4.1 Principios de Desarrollo y Redacción de Código
- **Estricta tipación:** Uso de TypeScript en todo el proyecto. Los cambios deben validarse con `npx tsc --noEmit`.
- **Independencia horaria:** Todas las fechas y horas se evalúan bajo la zona horaria `America/Lima` usando formateadores explícitos de `Intl.DateTimeFormat`.

---

## 5. Configuración de Despliegue e Integraciones (Webhooks)

### 5.1 Despliegue en Vercel
1. Se conecta el repositorio de GitHub a Vercel.
2. Se configuran las variables de entorno de producción.
3. El servidor de Vercel está configurado por defecto en UTC; toda la lógica de expiración de clases utiliza la hora de Lima de forma explícita para evitar desfases de 5 horas.

### 5.2 Integración del Webhook de Mercado Pago
Para notificar al servidor sobre los pagos realizados:
1. En el panel de Mercado Pago Developers, se configura el webhook apuntando a `https://tu-dominio.vercel.app/api/webhooks/mercadopago`.
2. Eventos a escuchar: `payment`.
3. El webhook extrae el ID de la reserva a través del parámetro `external_reference` provisto por Mercado Pago.

```
*Insertar captura de configuración de webhook en Mercado Pago Developers aquí*
```

---

## 6. Estrategia de Pruebas y Evidencias de Calidad

### 6.1 Pruebas de Compilación y Calidad Estática
Se ejecuta `npm run lint` y `npx tsc --noEmit` para garantizar la limpieza y tipado correcto del código.
```
*Insertar captura de consola ejecutando npx tsc --noEmit exitosamente aquí*
```

### 6.2 Evidencia de Recepción de Webhooks (Mercado Pago)
Para validar la integración del pago simulación/producción:
```
*Insertar captura de logs de Vercel/Mercado Pago confirmando la recepción exitosa del webhook aquí*
```

### 6.3 Evidencia de Adaptabilidad Visual (Mobile & Ultra-wide)
Demostración de que la interfaz visual no se deforma en pantallas ultra anchas gracias a la contención en contenedores `max-w-3xl` / `max-w-7xl` con paddings apropiados.
```
*Insertar captura de la interfaz de asistencia en pantalla Ultra-wide aquí*
*Insertar captura de la interfaz del plano de asientos en Mobile aquí*
```

---
*Fin de la Documentación Técnica del Sistema.*
