<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# CityxGov Backend API

API REST desarrollada con NestJS para el sistema CityxGov, proporcionando servicios para gestión gubernamental, planificación estratégica municipal, seguimiento de metas de desarrollo y administración de programas públicos en el contexto de la gestión pública colombiana.

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Tecnologías](#tecnologías)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Configuración del Proyecto](#configuración-del-proyecto)
- [Instalación](#instalación)
- [Desarrollo](#desarrollo)
- [Docker](#docker)
- [Testing](#testing)
- [Despliegue](#despliegue)
- [API Endpoints](#api-endpoints)
- [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
- [Licencia](#licencia)

## 🎯 Descripción

CityxGov API es una aplicación backend desarrollada con NestJS que proporciona servicios especializados para la gestión pública y gubernamental:

### **Gestión de Programas y Proyectos**
- **MGA (Metodología General Ajustada)**: Sistema de formulación y evaluación de proyectos de inversión pública
- **Programas**: Gestión integral de programas gubernamentales y sus componentes
- **Metas de Producto y Resultado**: Seguimiento y evaluación de indicadores de gestión

### **Planificación Estratégica**
- **Líneas Estratégicas**: Definición y seguimiento de ejes estratégicos municipales
- **ODS (Objetivos de Desarrollo Sostenible)**: Alineación con los objetivos de desarrollo sostenible
- **Enfoque Poblacional**: Gestión de políticas públicas con enfoque diferencial

### **Administración y Control**
- **Gestión de Usuarios**: Sistema de roles y permisos para diferentes niveles de acceso
- **Áreas Administrativas**: Organización territorial y funcional de la administración
- **Fuentes de Financiación**: Control y seguimiento de recursos y presupuestos

### **Servicios Principales**
- **Autenticación y Autorización**: Gestión segura de usuarios con Supabase Auth
- **Gestión Documental**: Procesamiento de archivos Excel para carga masiva de datos
- **APIs RESTful**: Endpoints completos para todas las funcionalidades del sistema
- **Integración con Base de Datos**: Conexión optimizada con Supabase para persistencia de datos

## 🛠 Tecnologías

- **Framework**: [NestJS](https://nestjs.com/) v11.0.1
- **Lenguaje**: TypeScript v5.7.3
- **Base de Datos**: Supabase
- **Autenticación**: Supabase Auth + JWT + Passport
- **Validación**: Class Validator + Class Transformer
- **Documentación API**: Swagger/OpenAPI
- **Gestión de Paquetes**: Yarn
- **Testing**: Jest
- **Containerización**: Docker + Docker Compose
- **Linting**: ESLint + Prettier
- **Procesamiento de Archivos**: XLSX para manejo de Excel
- **Encriptación**: bcrypt para seguridad de contraseñas

## 📁 Estructura del Proyecto

```
cityxgov-backend/
├── src/                          # Código fuente principal
│   ├── app.controller.ts         # Controlador principal de la aplicación
│   ├── app.service.ts           # Servicio principal de la aplicación
│   ├── app.module.ts            # Módulo raíz de la aplicación
│   ├── main.ts                  # Punto de entrada de la aplicación
│   ├── config/                  # Configuraciones del proyecto
│   │   ├── email/               # Configuración de servicios de email
│   │   │   ├── email.service.ts
│   │   │   └── templete/        # Plantillas de correo
│   │   └── supabase/            # Configuración de Supabase
│   │       ├── supabase.controller.ts
│   │       ├── supabase.module.ts
│   │       └── supabase.service.ts
│   ├── modules/                 # Módulos de la aplicación
│   │   ├── auth/                # Módulo de autenticación
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── guard/           # Guards de autenticación
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   └── local-auth.guard.ts
│   │   │   ├── strategies/      # Estrategias de Passport
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── local.strategy.ts
│   │   │   └── types/           # Tipos para autenticación
│   │   │       └── auth.type.ts
│   │   ├── usuarios/            # Módulo de gestión de usuarios
│   │   │   ├── usuarios.controller.ts
│   │   │   ├── usuarios.module.ts
│   │   │   ├── usuarios.service.ts
│   │   │   ├── dto/             # Data Transfer Objects
│   │   │   │   └── usuarios.dto.ts
│   │   │   ├── guard/           # Guards específicos
│   │   │   │   └── usuarios.guard.ts
│   │   │   └── pipes/           # Pipes de validación
│   │   │       ├── password.pipe.ts
│   │   │       └── usuarios.pipe.ts
│   │   ├── rol/                 # Módulo de roles y permisos
│   │   │   ├── rol.controller.ts
│   │   │   ├── rol.module.ts
│   │   │   ├── rol.service.ts
│   │   │   ├── decorator/       # Decoradores personalizados
│   │   │   │   └── roles.decorator.ts
│   │   │   ├── dto/
│   │   │   │   └── rol.dto.ts
│   │   │   ├── guard/
│   │   │   │   └── roles.guard.ts
│   │   │   └── pipes/
│   │   │       └── rol.pipe.ts
│   │   ├── area/                # Módulo de áreas administrativas
│   │   │   ├── area.controller.ts
│   │   │   ├── area.module.ts
│   │   │   ├── area.service.ts
│   │   │   ├── dto/
│   │   │   │   └── area.dto.ts
│   │   │   └── pipe/
│   │   │       └── area.pipe.ts
│   │   ├── programas/           # Módulo de programas gubernamentales
│   │   │   ├── programa.controller.ts
│   │   │   ├── programa.module.ts
│   │   │   ├── programa.service.ts
│   │   │   ├── dto/
│   │   │   │   └── programa.dto.ts
│   │   │   └── pipes/
│   │   │       └── programa.pipe.ts
│   │   ├── mga/                 # Módulo MGA (Metodología General Ajustada)
│   │   │   ├── mga.controller.ts
│   │   │   ├── mga.module.ts
│   │   │   ├── mga.service.ts
│   │   │   └── dto/
│   │   │       └── mga.dto.ts
│   │   ├── ods/                 # Módulo Objetivos de Desarrollo Sostenible
│   │   │   ├── ods.controller.ts
│   │   │   ├── ods.module.ts
│   │   │   ├── ods.service.ts
│   │   │   ├── dto/
│   │   │   │   └── ods.dto.ts
│   │   │   └── pipes/
│   │   │       └── ods.pipe.ts
│   │   ├── linea_estrategica/   # Módulo de líneas estratégicas
│   │   │   ├── linea_estrategica.controller.ts
│   │   │   ├── linea_estrategica.module.ts
│   │   │   ├── linea_estrategica.service.ts
│   │   │   ├── dto/
│   │   │   │   └── linea_estrategica.dto.ts
│   │   │   └── pipes/
│   │   │       └── linea_estrategica.pipe.ts
│   │   ├── meta_producto/       # Módulo de metas de producto
│   │   │   ├── meta_producto.controller.ts
│   │   │   ├── meta_producto.module.ts
│   │   │   ├── meta_producto.service.ts
│   │   │   ├── dto/
│   │   │   │   └── meta_producto.dto.ts
│   │   │   └── pipes/
│   │   │       └── meta_producto.pipe.ts
│   │   ├── meta_resultado/      # Módulo de metas de resultado
│   │   │   ├── meta_resultado.controller.ts
│   │   │   ├── meta_resultado.module.ts
│   │   │   ├── meta_resultado.service.ts
│   │   │   ├── dto/
│   │   │   │   └── meta_resultado.dto.ts
│   │   │   └── pipes/
│   │   │       └── meta_resultado.pipe.ts
│   │   ├── enfoque_poblacional/ # Módulo de enfoque poblacional
│   │   │   ├── enfoque_poblacional.controller.ts
│   │   │   ├── enfoque_poblacional.module.ts
│   │   │   ├── enfoque_poblacional.service.ts
│   │   │   ├── dto/
│   │   │   │   └── enfoque_poblacional.ts
│   │   │   └── pipe/
│   │   │       └── enfoque_poblacional.pipe.ts
│   │   ├── fuentes_financiacion/ # Módulo de fuentes de financiación
│   │   │   ├── fuentes_financiacion.controller.ts
│   │   │   ├── fuentes_financiacion.module.ts
│   │   │   ├── fuentes_financiacion.service.ts
│   │   │   ├── dto/
│   │   │   │   └── fuentes_financiacion.ts
│   │   │   └── pipes/
│   │   │       └── fuentes_financiacion.pipe.ts
│   │   └── financiacion_periodo/ # Módulo de períodos de financiación
│   │       ├── financiacion_periodo.controller.ts
│   │       ├── financiacion_periodo.module.ts
│   │       ├── financiacion_periodo.service.ts
│   │       ├── dto/
│   │       │   └── financiacion_periodo.dto.ts
│   │       └── pipes/
│   │           └── financiacion_periodo.pipe.ts
│   └── utils/                   # Utilidades compartidas
├── test/                       # Tests end-to-end
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── Dockerfile                  # Dockerfile para producción
├── Dockerfile.dev              # Dockerfile para desarrollo
├── docker-compose.yml          # Docker Compose para producción
├── docker-compose.dev.yml      # Docker Compose para desarrollo
├── .dockerignore               # Archivos ignorados por Docker
├── database-script.sql         # Script de base de datos
├── package.json                # Dependencias y scripts
├── yarn.lock                   # Lock file de Yarn
├── tsconfig.json               # Configuración de TypeScript
├── tsconfig.build.json         # Configuración de TypeScript para build
├── eslint.config.mjs           # Configuración de ESLint
├── nest-cli.json               # Configuración de NestJS CLI
└── README.md                   # Este archivo
```

### 📂 Descripción de Módulos

## 🔐 Módulo de Usuarios
Gestión de usuarios, perfiles, roles y organización administrativa.

- **`auth/`** - Sistema de autenticación con JWT y recuperación de contraseñas
- **`usuarios/`** - CRUD de usuarios y gestión de estados de cuenta
- **`rol/`** - Control de roles y permisos del sistema
- **`area/`** - Gestión de áreas administrativas y asignación de personal

## 📊 Módulo Plan Indicativo
Planificación estratégica y seguimiento de metas institucionales.

- **`programas/`** - Gestión de programas gubernamentales y seguimiento
- **`linea_estrategica/`** - Definición de líneas estratégicas municipales
- **`meta_resultado/`** - Gestión de metas de resultado e indicadores de impacto
- **`meta_producto/`** - Control de metas de producto y entregables

## 📚 Módulo de Catálogo
Catálogos maestros y referencias del sistema.

- **`mga/`** - Metodología General Ajustada para proyectos de inversión
- **`ods/`** - Objetivos de Desarrollo Sostenible y alineación de proyectos
- **`fuentes_financiacion/`** - Catálogo de fuentes de recursos y financiación
- **`financiacion_periodo/`** - Gestión de períodos fiscales y vigencias
- **`enfoque_poblacional/`** - Catalogación de grupos poblacionales objetivo

## ⚙️ Configuración del Proyecto

### Prerrequisitos

- Node.js 22.x o superior
- Yarn
- Docker y Docker Compose (opcional)
- Cuenta de Supabase

## 🚀 Instalación

### Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/Z-inc/cityxgov-backend.git
cd cityxgov-backend

# Instalar dependencias
yarn install

# Ejecutar en modo desarrollo
yarn start:dev
```

### Instalación con Docker

```bash
# Clonar el repositorio
git clone https://github.com/Z-inc/cityxgov-backend.git
cd cityxgov-backend

# Ejecutar con Docker Compose (desarrollo)
docker compose -f docker-compose.dev.yml up --build
```

## 💻 Desarrollo

### Scripts Disponibles

```bash
# Desarrollo
yarn start:dev          # Modo desarrollo con hot reload
yarn start:debug        # Modo debug
yarn start              # Modo normal

# Construcción
yarn build              # Compilar para producción
yarn start:prod         # Ejecutar versión de producción

# Desarrollo con Docker
docker compose -f docker-compose.dev.yml up
```

La aplicación estará disponible en `http://localhost:3000`
La documentación Swagger estará disponible en `http://localhost:3000/api`

## 🐳 Docker

### Desarrollo con Docker

```bash
# Construir y ejecutar en modo desarrollo
docker compose -f docker-compose.dev.yml up --build

# Solo ejecutar (si ya está construido)
docker compose -f docker-compose.dev.yml up

# Parar contenedores
docker compose -f docker-compose.dev.yml down
```

### Producción con Docker

```bash
# Construir y ejecutar en modo producción
docker compose up --build

# Solo ejecutar (si ya está construido)
docker compose up -d

# Parar contenedores
docker compose down
```

### Comandos Docker Útiles

```bash
# Ver logs
docker compose logs -f

# Acceder al contenedor
docker compose exec cityxgov-backend-dev sh

# Limpiar volúmenes
docker compose down -v

# Reconstruir desde cero
docker compose build --no-cache
```

## 🚀 Despliegue

### Variables de Entorno Requeridas

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE__KEY=your_anon_key
SUPABASE_SERVICE_ROLE_=your_service_role_key

# Application Configuration
PORT=3000

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

```

### Despliegue con Docker

```bash
# Construir imagen de producción
docker build -t cityxgov-backend:latest .

# Ejecutar en producción
docker run -d \
  --name cityxgov-backend \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e SUPABASE_URL=your_url \
  -e SUPABASE_KEY=your_key \
  cityxgov-backend:latest
```

### Despliegue con Docker Compose

```bash
# Configurar variables de entorno en .env
# Desplegar
docker compose up -d
```

## 📡 API Endpoints

### Autenticación
- `POST /auth/login` - Iniciar sesión
- `POST /auth/logout` - Cerrar sesión
- `POST /auth/recovery` - Recuperar contraseña
- `POST /auth/validate-otp` - Validar código OTP
- `POST /auth/reset-password` - Restablecer contraseña
- `PATCH /auth/change-password` - Cambiar contraseña

### Usuarios
- `GET /usuarios` - Listar usuarios
- `GET /usuarios/:id` - Obtener usuario por ID
- `POST /usuarios` - Crear usuario
- `PATCH /usuarios/:id` - Actualizar usuario
- `PATCH /usuarios/estado/:id` - Cambiar estado de usuario
- `PATCH /usuarios/cambiar-clave/:id` - Cambiar contraseña de usuario
- `DELETE /usuarios/:id` - Eliminar usuario

### MGA (Metodología General Ajustada)
- `GET /mga` - Listar proyectos MGA
- `GET /mga/:id` - Obtener proyecto por ID
- `POST /mga/upload-excel` - Cargar archivo Excel
- `DELETE /mga/:id` - Eliminar proyecto

### Programas
- `GET /programa` - Listar programas
- `GET /programa/:id` - Obtener programa por ID
- `POST /programa` - Crear programa
- `PATCH /programa/:id` - Actualizar programa
- `DELETE /programa/:id` - Eliminar programa

### Y más endpoints para cada módulo...

Para documentación completa de la API, visita: `http://localhost:3000/api`

## 🔒 Seguridad

- **Autenticación JWT**: Tokens seguros con Supabase Auth
- **Autorización por roles**: Sistema de permisos granular
- **Validación de datos**: Pipes de validación en todos los endpoints
- **CORS configurado**: Protección contra solicitudes no autorizadas
- **Encriptación de contraseñas**: bcrypt para hash seguro
- **Variables de entorno**: Configuración sensible protegida
- **Guards personalizados**: Protección de rutas específicas

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

### Guías de Contribución
<<<<<<< develop

- Sigue las convenciones de código establecidas
- Asegúrate de que el linter pase sin errores
- Actualiza la documentación según sea necesario
- Usa commits descriptivos y significativos
- Respeta la arquitectura modular del proyecto

---

## 👥 Autores

**Equipo de Desarrollo de Z**

---

## 📊 Estado del Proyecto

### Estado Actual
🟢 **EN DESARROLLO**

## 📄 Licencia

Este proyecto está bajo Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

<div align="center">
=======

- Sigue las convenciones de código establecidas
- Asegúrate de que el linter pase sin errores
- Actualiza la documentación según sea necesario
- Usa commits descriptivos y significativos
- Respeta la arquitectura modular del proyecto

---

## 👥 Autores

**Equipo de Desarrollo de Z**

---

## 📊 Estado del Proyecto

### Estado Actual
🟢 **EN DESARROLLO**

## 📄 Licencia

Este proyecto está bajo Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

<div align="center">

**Desarrollado con ❤️ por ZETA INC**

[![ZETA INC](https://img.shields.io/badge/ZETA%20INC-2025-blue.svg)](https://zetainc.com)

</div>


>>>>>>> master

**Desarrollado con ❤️ por ZETA INC**

[![ZETA INC](https://img.shields.io/badge/ZETA%20INC-2025-blue.svg)](https://zetainc.com)
