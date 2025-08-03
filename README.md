# Conclusión y análisis de resultados de los tests

Durante la ejecución de los tests automatizados sobre la API pública https://fakestoreapi.com, se observaron los siguientes puntos clave:

## 1. Fallos por APIs externas y uso de datos mockeados
- Algunos tests dependen de servicios externos (por ejemplo, WorldTimeAPI, Quotable, JSONPlaceholder) para obtener datos realistas. Si estas APIs externas no están disponibles, el código implementado utiliza **datos mockeados** o valores por defecto para garantizar la resiliencia y que los tests no fallen por causas externas. Esto se realiza devolviendo datos simulados (mock) en los métodos de obtención de datos externos. Así, **no es un error de lógica del código implementado**, sino una limitación de depender de servicios de terceros, y la suite está preparada para ello.

## 2. Respuestas inconsistentes de FakeStoreAPI
- FakeStoreAPI es una API de demostración y, en ocasiones, responde con códigos de estado inesperados (por ejemplo, 200 o 500 en vez de 404/401 para recursos inexistentes o datos inválidos). Esto genera fallos en los asserts más estrictos de los tests.
- En un entorno real, se esperaría una respuesta más consistente y acorde a los estándares REST (por ejemplo, 404 para recursos no encontrados, 400 para datos inválidos, 401 para autenticación fallida, etc.).
- Los tests han sido diseñados para cubrir los casos ideales,donde la API es inconsistente.

## 3. Validación del código implementado
- Se verificó que los requests enviados desde los tests son correctos y equivalentes a los realizados desde Postman (headers, body, formato, etc.).
- Los fallos observados **no corresponden a errores de lógica en el código de automatización**, sino a limitaciones o comportamientos inesperados de la API de demo o de los servicios externos.

## 4. Recomendaciones
- Para una API real de producción, los asserts deberían ser estrictos y esperar siempre los códigos de estado correctos.
- Para pruebas técnicas con APIs públicas de demostración, es importante documentar estos hallazgos y justificar cualquier flexibilidad en los asserts.

---
**En resumen:** Los tests están correctamente implementados y cubren los casos de negocio requeridos. Los fallos observados se deben a la naturaleza de la API pública y a la dependencia de servicios externos, no a errores en la lógica del código.


## 🚦 Integración Continua (CI) con GitHub Actions

Este proyecto incluye un flujo de trabajo robusto de GitHub Actions para integración continua, ubicado en `.github/workflows/playwright.yml`.

**¿Qué hace el workflow?**

- Instala automáticamente todas las dependencias y navegadores de Playwright.
- Ejecuta toda la suite de tests en cada push, pull request y de forma programada diariamente.
- Ejecuta los tests en múltiples versiones de Node.js (18.x, 20.x) para asegurar compatibilidad.
- Sube los reportes de pruebas (HTML, JSON, XML) como artefactos para su revisión.
- Publica un resumen de los resultados de los tests como comentario en los pull requests.
- Realiza chequeos de salud sobre la API de FakeStore y todas las APIs externas utilizadas en las pruebas.
- Notifica sobre el éxito o fallo de los tests (personalizable para Slack, email, etc.).

**¿Cómo se usa?**

Solo haz push de tu código o abre un pull request—GitHub Actions se encargará del resto. Puedes ver los resultados y descargar los reportes directamente desde la pestaña Actions en tu repositorio de GitHub.

**Ejemplo de archivo de workflow:**

```yaml
name: Playwright API Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * *'

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    steps:
    - name: Checkout repository
      uses: actions/checkout@v4
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    - name: Install dependencies
      run: npm ci
    - name: Install Playwright
      run: npx playwright install --with-deps
    - name: Run Playwright tests
      run: npm test
      env:
        CI: true
    - name: Upload test results
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report-node-${{ matrix.node-version }}
        path: |
          playwright-report/
          test-results/
          test-results.json
          test-results.xml
        retention-days: 30
    - name: Publish test results
      uses: dorny/test-reporter@v1
      if: success() || failure()
      with:
        name: Playwright Test Results (Node ${{ matrix.node-version }})
        path: test-results.xml
        reporter: java-junit
    - name: Comment PR with test results
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v7
      with:
        script: |
          const fs = require('fs');
          try {
            const testResults = JSON.parse(fs.readFileSync('test-results.json', 'utf8'));
            const { stats } = testResults;
            const comment = `
            ## 🧪 Test Results (Node ${{ matrix.node-version }})
            - ✅ **Passed**: ${stats.passed || 0}
            - ❌ **Failed**: ${stats.failed || 0}
            - ⏭️ **Skipped**: ${stats.skipped || 0}
            - ⏱️ **Duration**: ${Math.round((stats.duration || 0) / 1000)}s
            ${stats.failed > 0 ? '❌ Some tests failed. Check the full report for details.' : '✅ All tests passed!'}
            `;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
          } catch (error) {
            console.log('Could not post test results comment:', error.message);
          }
  api-health-check:
    runs-on: ubuntu-latest
    name: API Health Check
    steps:
    - name: Check FakeStore API Health
      run: |
        echo "Checking FakeStore API health..."
        curl -f https://fakestoreapi.com/products || exit 1
        curl -f https://fakestoreapi.com/users || exit 1
        curl -f https://fakestoreapi.com/carts || exit 1
        echo "✅ FakeStore API is healthy"
    - name: Check External APIs Health
      run: |
        echo "Checking external APIs health..."
        curl -f https://jsonplaceholder.typicode.com/users/1 || echo "⚠️ JSONPlaceholder unavailable"
        curl -f https://api.quotable.io/random || echo "⚠️ Quotable API unavailable"
        curl -f https://picsum.photos/100/100 || echo "⚠️ Lorem Picsum unavailable"
        curl -f https://worldtimeapi.org/api/timezone/UTC || echo "⚠️ WorldTime API unavailable"
        echo "✅ External API health check complete"
  notify:
    needs: [test, api-health-check]
    runs-on: ubuntu-latest
    if: always()
    steps:
    - name: Notify on failure
      if: needs.test.result == 'failure'
      run: |
        echo "🚨 Tests failed! Check the workflow logs for details."
        # Add notification logic here (Slack, email, etc.)
    - name: Notify on success
      if: needs.test.result == 'success'
      run: |
        echo "✅ All tests passed successfully!"
        # Add success notification logic here
```


# Suite Automatizada de Pruebas para FakeStore API

Este repositorio contiene una suite automatizada de pruebas para la API de FakeStore, diseñada específicamente para la demostración de buenas prácticas en pruebas de APIs. La suite está implementada con Playwright y TypeScript, y cubre todos los endpoints requeridos y criterios de evaluación técnica.


## 🎯 Descripción General del Proyecto

Este proyecto automatiza las pruebas para la API de FakeStore (https://fakestoreapi.com), cubriendo todos los endpoints principales con escenarios de prueba completos, incluyendo casos exitosos, manejo de errores y casos límite.



## 📋 Endpoints Probados (Alcance de la Prueba Técnica)

- **GET /products** – Listar productos
- **GET /products/{id}** – Obtener detalles de un producto
- **POST /users** – Registrar nuevo usuario
- **POST /auth/login** – Autenticación de usuario
- **GET /carts/user/2** – Obtener el carrito del usuario 2
- **DELETE /carts/{id}** – Eliminar un carrito
- **PUT /products/{id}** – Actualizar al menos 2 productos

## 🏗️ Estructura del Proyecto

```
src/
├── interfaces/          # Interfaces TypeScript
│   ├── product.interface.ts
│   ├── user.interface.ts
│   ├── cart.interface.ts
│   └── auth.interface.ts
├── pages/              # Objetos de página para la API (patrón POM)
│   ├── base-api.page.ts
│   ├── products-api.page.ts
│   ├── users-api.page.ts
│   ├── auth-api.page.ts
│   └── carts-api.page.ts
├── mocks/              # Datos mock para pruebas
│   ├── products.mock.ts
│   ├── users.mock.ts
│   └── carts.mock.ts
├── utils/              # Utilidades
│   ├── data-generator.ts
│   └── external-data.ts
└── tests/              # Especificaciones de pruebas
    ├── products.spec.ts
    ├── users.spec.ts
    ├── auth.spec.ts
    └── carts.spec.ts
```

## 🚀 Primeros Pasos

### Requisitos Previos

- Node.js (v16 o superior)
- npm o yarn

### Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/andresreyes22/project-automatization.git
cd playwright-fakestore-api-tests
```

2. Instala las dependencias:
```bash
npm install
```

3. Instala los navegadores de Playwright:
```bash
npx playwright install
```

### Ejecución de Pruebas

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas en modo UI
npm run test:ui

# Ejecutar un suite de pruebas específico
npm run test:products
npm run test:users
npm run test:auth
npm run test:carts

# Ejecutar pruebas en modo headed
npm run test:headed

# Depurar pruebas
npm run test:debug

# Ver reporte de pruebas
npm run test:report
```

## 🧪 Cobertura de Pruebas

### Casos Positivos
- ✅ Operaciones exitosas de la API con datos válidos
- ✅ Validación de estructura de datos
- ✅ Verificación de códigos de estado de respuesta
- ✅ Validación de lógica de negocio

### Casos Negativos
- ✅ Manejo de datos inválidos
- ✅ Solicitudes a recursos inexistentes
- ✅ Tipos de datos inválidos
- ✅ Campos requeridos faltantes
- ✅ Escenarios de casos límite

### Pruebas de Seguridad
- ✅ Intentos de inyección SQL
- ✅ Prevención de ataques XSS
- ✅ Sanitización de entradas
- ✅ Validación de tokens de autenticación

### Rendimiento y Confiabilidad
- ✅ Manejo de solicitudes concurrentes
- ✅ Validación de límites de tasa (rate limiting)
- ✅ Manejo de timeouts de red
- ✅ Mecanismos de recuperación ante errores

## 🌐 Integración con APIs Externas

La suite de pruebas se integra con APIs externas para evitar datos hardcodeados:

- **JSONPlaceholder API** - Para generación realista de datos de usuario
- **Quotable API** - Para descripciones dinámicas de productos
- **Lorem Picsum** - Para URLs de imágenes aleatorias
- **WorldTimeAPI** - Para datos de fecha/hora actual

### Verificación de Disponibilidad de APIs Externas

La suite incluye validación automática de la disponibilidad de las APIs externas y degradación controlada cuando algún servicio no está disponible.

## 📊 Características Clave

### 1. Page Object Model (POM)
- Clases cliente de API modulares y reutilizables
- Manejo centralizado de peticiones
- Gestión consistente de errores
- Interacciones tipadas con TypeScript

### 2. Manejo Integral de Errores
- Gestión de timeouts de red
- Manejo de respuestas inválidas
- Validación de códigos de estado HTTP
- Degradación controlada para dependencias externas

### 3. Generación Dinámica de Datos
- Integración con Faker.js para datos realistas
- Obtención de datos desde APIs externas
- Pruebas de valores límite
- Generación de escenarios de casos límite

### 4. Arquitectura Robusta de Pruebas
- Interfaces TypeScript para seguridad de tipos
- Gestión de datos mock
- Funciones utilitarias para operaciones comunes
- Estructura de pruebas consistente

## 📈 Reportes de Pruebas

La suite genera múltiples formatos de reporte:
- **Reporte HTML** - Visor interactivo de resultados
- **Reporte JSON** - Resultados legibles por máquina
- **Reporte JUnit** - Compatible con integración CI/CD

## 🔧 Configuración

### Configuración de Playwright
- Timeouts optimizados para pruebas de API
- Múltiples reportes para distintos usos
- Lógica de reintentos para escenarios inestables
- Soporte para ejecución en paralelo

### Variables de Entorno
```bash
# Opcional: URL base personalizada
BASE_URL=https://fakestoreapi.com

# Opcional: Timeout de pruebas
TEST_TIMEOUT=30000
```

## 🚦 Integración CI/CD

### Configuración de GitHub Actions
El proyecto incluye un workflow de GitHub Actions (`.github/workflows/playwright.yml`) que:
- Instala dependencias
- Ejecuta toda la suite de pruebas
- Genera y publica reportes de pruebas
- Soporta múltiples versiones de Node.js

### Ejecución en CI
```yaml
- name: Ejecutar pruebas Playwright
  run: npm test
```

## 📝 Decisiones Técnicas

### 1. Elección de Playwright
- **Por qué**: Capacidades robustas para pruebas de API, soporte TypeScript, excelentes reportes
- **Beneficios**: Lógica de reintentos, ejecución en paralelo, aserciones completas

### 2. Implementación en TypeScript
- **Por qué**: Seguridad de tipos, mejor soporte en IDE, errores detectados en compilación
- **Beneficios**: Mejor calidad de código, mayor mantenibilidad, mejor experiencia de desarrollo

### 3. Page Object Model
- **Por qué**: Separación de responsabilidades, reutilización, mantenibilidad
- **Beneficios**: Fácil actualización ante cambios de API, menos duplicidad, mejor organización

### 4. Integración con APIs Externas
- **Por qué**: Evitar datos hardcodeados, escenarios realistas
- **Beneficios**: Pruebas más completas, variación real de datos, mejor cobertura

### 5. Datos Mock Completos
- **Por qué**: Escenarios predecibles, capacidad de pruebas offline
- **Beneficios**: Ejecución rápida, datos confiables, fácil mantenimiento

## 🧩 Escenarios de Prueba

### API de Productos
- Obtener todos los productos con paginación
- Obtener producto por ID (válido/inválido)
- Crear productos con descripciones externas
- Actualizar productos (total/parcial)
- Eliminar productos
- Filtrado por categoría
- Manejo de tipos de datos inválidos

### API de Usuarios
- Creación de usuario con integración de datos externos
- Recuperación y validación de usuario
- Validación de formato de email
- Validación de geolocalización de dirección
- Manejo de datos de usuario inválidos
- Pruebas de valores límite

### API de Autenticación
- Autenticación con credenciales válidas
- Rechazo de credenciales inválidas
- Validación de formato de token JWT
- Manejo de límites de tasa
- Pruebas de inyección de seguridad
- Autenticaciones concurrentes

### API de Carritos
- Creación y gestión de carritos
- Recuperación de carritos por usuario
- Filtrado por rango de fechas
- Validación de cantidad de productos
- Verificación de eliminación de carritos
- Integración de fechas externas

## 🤝 Contribuciones

1. Haz un fork del repositorio
2. Crea una rama de feature
3. Agrega pruebas completas para nuevas funcionalidades
4. Asegúrate de que todas las pruebas pasen
5. Envía un pull request

## 🆘 Solución de Problemas

### Problemas Comunes

1. **Timeouts de APIs Externas**
   - Las pruebas están diseñadas para manejar la indisponibilidad de APIs externas
   - Verifica tu conexión a internet si todas las pruebas externas fallan

2. **Problemas de Instalación de Playwright**
   - Ejecuta `npx playwright install --force`
   - Asegúrate de la compatibilidad de la versión de Node.js

3. **Fallas en Pruebas**
   - Revisa el reporte HTML: `npm run test:report`
   - Consulta los logs de consola para información detallada de errores

### Modo Debug
```bash
npm run test:debug
```

Esto abre el inspector de Playwright para depuración paso a paso.


# 📋 Documentación de Casos de Prueba (QA Refinamiento - INVEST)

Esta sección documenta exhaustivamente todos los casos de prueba automatizados, agrupados por funcionalidad (`describe`) y cada test, siguiendo el principio INVEST y la estructura QA:

---

## Autenticación (`auth.spec.ts`)

### POST /auth/login - User Authentication

#### Test: should successfully authenticate with valid credentials
**Tipo de prueba:** Funcional positiva
**Precondiciones:** Usuario válido registrado en el sistema
**Datos de entrada:** username y password válidos
**Pasos:**
1. Enviar petición POST /auth/login con credenciales válidas
**Resultados esperados:**
- Status 200
- Respuesta contiene un token JWT válido y no vacío
- Campo `success` es true

#### Test: should reject authentication with invalid credentials
**Tipo de prueba:** Funcional negativa
**Precondiciones:** Usuario inválido/no registrado
**Datos de entrada:** username y/o password incorrectos
**Pasos:**
1. Enviar POST /auth/login con credenciales inválidas
**Resultados esperados:**
- Status 401, 400 o 404 (nunca 200)
- Campo `success` es false

#### Test: should reject authentication with empty username
**Tipo de prueba:** Validación de campos obligatorios
**Precondiciones:** N/A
**Datos de entrada:** username vacío, password válido
**Pasos:**
1. Enviar POST /auth/login con username vacío
**Resultados esperados:**
- Status 400 o 401
- Campo `success` es false

#### Test: should reject authentication with empty password
**Tipo de prueba:** Validación de campos obligatorios
**Precondiciones:** N/A
**Datos de entrada:** username válido, password vacío
**Pasos:**
1. Enviar POST /auth/login con password vacío
**Resultados esperados:**
- Status 400 o 401
- Campo `success` es false

#### Test: should reject authentication with missing username field
**Tipo de prueba:** Validación de campos obligatorios
**Precondiciones:** N/A
**Datos de entrada:** Solo password
**Pasos:**
1. Enviar POST /auth/login sin campo username
**Resultados esperados:**
- Status 400 o 401
- Campo `success` es false

#### Test: should reject authentication with missing password field
**Tipo de prueba:** Validación de campos obligatorios
**Precondiciones:** N/A
**Datos de entrada:** Solo username
**Pasos:**
1. Enviar POST /auth/login sin campo password
**Resultados esperados:**
- Status 400 o 401
- Campo `success` es false

#### Test: should handle authentication with special characters in credentials
**Tipo de prueba:** Seguridad (robustez ante caracteres especiales)
**Precondiciones:** N/A
**Datos de entrada:** username y password con caracteres especiales
**Pasos:**
1. Enviar POST /auth/login con caracteres especiales
**Resultados esperados:**
- Status 200, 400 o 401

#### Test: should handle authentication with very long credentials
**Tipo de prueba:** Límite de datos
**Precondiciones:** N/A
**Datos de entrada:** username y password de 1000 caracteres
**Pasos:**
1. Enviar POST /auth/login con credenciales muy largas
**Resultados esperados:**
- Status 400, 401 o 413

#### Test: should handle authentication with null values
**Tipo de prueba:** Validación de tipos
**Precondiciones:** N/A
**Datos de entrada:** username y password null
**Pasos:**
1. Enviar POST /auth/login con valores null
**Resultados esperados:**
- Status 400 o 401
- Campo `success` es false

#### Test: should handle authentication with non-string values
**Tipo de prueba:** Validación de tipos
**Precondiciones:** N/A
**Datos de entrada:** username numérico, password booleano
**Pasos:**
1. Enviar POST /auth/login con tipos incorrectos
**Resultados esperados:**
- Status 400 o 401
- Campo `success` es false

#### Test: should handle authentication with SQL injection attempts
**Tipo de prueba:** Seguridad (inyección SQL)
**Precondiciones:** N/A
**Datos de entrada:** username y password con payload de inyección SQL
**Pasos:**
1. Enviar POST /auth/login con intento de inyección SQL
**Resultados esperados:**
- Status 400 o 401
- Campo `success` es false

#### Test: should handle authentication with XSS attempts
**Tipo de prueba:** Seguridad (XSS)
**Precondiciones:** N/A
**Datos de entrada:** username y password con payload XSS
**Pasos:**
1. Enviar POST /auth/login con intento de XSS
**Resultados esperados:**
- Status 400 o 401
- Campo `success` es false

#### Test: should validate JWT token structure when authentication succeeds
**Tipo de prueba:** Validación de formato de token
**Precondiciones:** Login exitoso
**Datos de entrada:** Credenciales válidas
**Pasos:**
1. Enviar POST /auth/login
2. Validar estructura del token JWT (3 partes, base64)
**Resultados esperados:**
- Token con 3 partes separadas por punto, cada parte no vacía, primer segmento base64

#### Test: should handle concurrent authentication requests
**Tipo de prueba:** Concurrencia
**Precondiciones:** Usuario válido
**Datos de entrada:** Credenciales válidas
**Pasos:**
1. Enviar 5 peticiones POST /auth/login en paralelo
**Resultados esperados:**
- Todas las respuestas tienen el mismo status (máximo 2 diferentes por rate limit)

#### Test: should handle authentication with different case username
**Tipo de prueba:** Sensibilidad a mayúsculas/minúsculas
**Precondiciones:** Usuario válido
**Datos de entrada:** username en mayúsculas, password válido
**Pasos:**
1. Enviar POST /auth/login con username en mayúsculas
**Resultados esperados:**
- Status 200 o 401

#### Test: should handle authentication rate limiting gracefully
**Tipo de prueba:** Límite de tasa (rate limiting)
**Precondiciones:** Usuario inválido
**Datos de entrada:** Credenciales inválidas
**Pasos:**
1. Enviar 10 peticiones POST /auth/login seguidas
**Resultados esperados:**
- Si hay rate limit: status 429 presente
- Si no: todos 400 o 401

### Token Validation Utility Tests

#### Test: should validate correct JWT token format
**Tipo de prueba:** Validación de formato
**Precondiciones:** N/A
**Datos de entrada:** Token JWT válido
**Pasos:**
1. Validar formato del token
**Resultados esperados:**
- Token válido pasa la validación

#### Test: should reject invalid token formats
**Tipo de prueba:** Validación de formato
**Precondiciones:** N/A
**Datos de entrada:** Tokens inválidos (vacío, partes incorrectas)
**Pasos:**
1. Validar formato de cada token inválido
**Resultados esperados:**
- Todos los tokens inválidos fallan la validación

### Error Handling and Edge Cases

#### Test: should handle malformed JSON in login request
**Tipo de prueba:** Manejo de errores
**Precondiciones:** N/A
**Datos de entrada:** JSON malformado
**Pasos:**
1. Enviar login con datos no objeto
**Resultados esperados:**
- Status 400 o 401, o error manejado

#### Test: should handle network timeout in authentication
**Tipo de prueba:** Manejo de errores de red
**Precondiciones:** N/A
**Datos de entrada:** N/A
**Pasos:**
1. Simular timeout de red en login
**Resultados esperados:**
- Respuesta definida o error manejado

---


## Productos (`products.spec.ts`)

### GET /products - Get All Products

#### Test: should successfully retrieve all products
**Tipo de prueba:** Funcional positiva
**Precondiciones:** Productos existentes en la base de datos
**Datos de entrada:** N/A
**Pasos:**
1. Enviar GET /products
**Resultados esperados:**
- Status 200
- Respuesta es un array no vacío de productos
- Cada producto tiene los campos requeridos
**Estimación:** 1 SP

#### Test: should retrieve products with limit and sort parameters
**Tipo de prueba:** Funcional positiva (parámetros)
**Precondiciones:** Productos existentes
**Datos de entrada:** Parámetro limit=5, sort='desc'
**Pasos:**
1. Enviar GET /products?limit=5&sort=desc
**Resultados esperados:**
- Status 200
- Array de productos con longitud <= 5
**Estimación:** 1 SP

#### Test: should handle invalid limit parameter gracefully
**Tipo de prueba:** Validación de parámetros
**Precondiciones:** N/A
**Datos de entrada:** limit=-1
**Pasos:**
1. Enviar GET /products?limit=-1
**Resultados esperados:**
- Status 200
- Respuesta es un array (puede ser vacío)
**Estimación:** 1 SP

### GET /products/{id} - Get Product by ID

#### Test: should successfully retrieve a specific product
**Tipo de prueba:** Funcional positiva
**Precondiciones:** Producto con ID 1 existe
**Datos de entrada:** id=1
**Pasos:**
1. Enviar GET /products/1
**Resultados esperados:**
- Status 200
- Producto con id=1 y campos requeridos
**Estimación:** 1 SP

#### Test: should return 404 for non-existent product
**Tipo de prueba:** Negativa (no encontrado)
**Precondiciones:** ID no existente
**Datos de entrada:** id=99999
**Pasos:**
1. Enviar GET /products/99999
**Resultados esperados:**
- Status 404
- Campo success es false
**Estimación:** 1 SP

#### Test: should handle invalid product ID formats
**Tipo de prueba:** Validación de parámetros
**Precondiciones:** N/A
**Datos de entrada:** id=0, id=-1
**Pasos:**
1. Enviar GET /products/0 y /products/-1
**Resultados esperados:**
- Status 200 o 404
**Estimación:** 1 SP

### GET /products/categories - Get All Categories

#### Test: should successfully retrieve all product categories
**Tipo de prueba:** Funcional positiva
**Precondiciones:** Categorías existentes
**Datos de entrada:** N/A
**Pasos:**
1. Enviar GET /products/categories
**Resultados esperados:**
- Status 200
- Respuesta es un array no vacío de categorías
**Estimación:** 1 SP

### GET /products/category/{category} - Get Products by Category

#### Test: should successfully retrieve products by valid category
**Tipo de prueba:** Funcional positiva
**Precondiciones:** Categoría válida (ej: electronics)
**Datos de entrada:** category=electronics
**Pasos:**
1. Enviar GET /products/category/electronics
**Resultados esperados:**
- Status 200
- Todos los productos tienen category=electronics
**Estimación:** 1 SP

#### Test: should handle invalid category gracefully
**Tipo de prueba:** Validación de parámetros
**Precondiciones:** N/A
**Datos de entrada:** category=nonexistent-category
**Pasos:**
1. Enviar GET /products/category/nonexistent-category
**Resultados esperados:**
- Status 200, 400 o 404
**Estimación:** 1 SP

### POST /products - Create Product

#### Test: should successfully create a new product with valid data
**Tipo de prueba:** Funcional positiva (creación)
**Precondiciones:** N/A
**Datos de entrada:** Datos válidos de producto
**Pasos:**
1. Enviar POST /products con datos válidos
**Resultados esperados:**
- Status 200
- Producto creado con id y datos coinciden
**Estimación:** 2 SP

#### Test: should create product with external data from quotable API
**Tipo de prueba:** Integración externa
**Precondiciones:** API quotable disponible
**Datos de entrada:** Descripción e imagen externas
**Pasos:**
1. Obtener datos externos
2. Enviar POST /products con esos datos
**Resultados esperados:**
- Status 200
- Producto creado con descripción e imagen externas
**Estimación:** 2 SP

#### Test: should create product with generated random data
**Tipo de prueba:** Límite/aleatoriedad
**Precondiciones:** N/A
**Datos de entrada:** Datos aleatorios
**Pasos:**
1. Generar datos aleatorios
2. Enviar POST /products
**Resultados esperados:**
- Status 200
- Producto creado con id
**Estimación:** 2 SP

#### Test: should handle invalid product data
**Tipo de prueba:** Validación de datos
**Precondiciones:** N/A
**Datos de entrada:** Datos inválidos
**Pasos:**
1. Enviar POST /products con datos inválidos
**Resultados esperados:**
- Status 200 o 400
**Estimación:** 1 SP

#### Test: should handle product data with invalid data types
**Tipo de prueba:** Validación de tipos
**Precondiciones:** N/A
**Datos de entrada:** Tipos incorrectos
**Pasos:**
1. Enviar POST /products con tipos incorrectos
**Resultados esperados:**
- Status 200 o 400
**Estimación:** 1 SP

### PUT /products/{id} - Update Product

#### Test: should successfully update an existing product
**Tipo de prueba:** Funcional positiva (actualización)
**Precondiciones:** Producto existente
**Datos de entrada:** id=1, datos válidos
**Pasos:**
1. Enviar PUT /products/1 con datos válidos
**Resultados esperados:**
- Status 200
- Producto actualizado con datos correctos
**Estimación:** 2 SP

#### Test: should successfully perform partial update of product
**Tipo de prueba:** Actualización parcial
**Precondiciones:** Producto existente
**Datos de entrada:** id=2, datos parciales
**Pasos:**
1. Enviar PUT /products/2 con datos parciales
**Resultados esperados:**
- Status 200
- Producto actualizado parcialmente
**Estimación:** 2 SP

#### Test: should handle update of non-existent product
**Tipo de prueba:** Negativa (no encontrado)
**Precondiciones:** id inexistente
**Datos de entrada:** id=99999
**Pasos:**
1. Enviar PUT /products/99999
**Resultados esperados:**
- Status 200 o 404
**Estimación:** 1 SP

#### Test: should handle invalid update data
**Tipo de prueba:** Validación de datos
**Precondiciones:** Producto existente
**Datos de entrada:** Datos inválidos
**Pasos:**
1. Enviar PUT /products/1 con datos inválidos
**Resultados esperados:**
- Status 200 o 400
**Estimación:** 1 SP

### DELETE /products/{id} - Delete Product

#### Test: should successfully delete an existing product
**Tipo de prueba:** Funcional positiva (eliminación)
**Precondiciones:** Producto existente
**Datos de entrada:** id=1
**Pasos:**
1. Enviar DELETE /products/1
**Resultados esperados:**
- Status 200
- Producto eliminado
**Estimación:** 1 SP

#### Test: should handle deletion of non-existent product
**Tipo de prueba:** Negativa (no encontrado)
**Precondiciones:** id inexistente
**Datos de entrada:** id=99999
**Pasos:**
1. Enviar DELETE /products/99999
**Resultados esperados:**
- Status 200 o 404
**Estimación:** 1 SP

#### Test: should handle invalid product ID for deletion
**Tipo de prueba:** Validación de parámetros
**Precondiciones:** N/A
**Datos de entrada:** id=-1
**Pasos:**
1. Enviar DELETE /products/-1
**Resultados esperados:**
- Status 200, 400 o 404
**Estimación:** 1 SP

### Error Handling and Edge Cases

#### Test: should handle network timeout gracefully
**Tipo de prueba:** Manejo de errores de red
**Precondiciones:** N/A
**Datos de entrada:** N/A
**Pasos:**
1. Simular timeout de red en GET /products
**Resultados esperados:**
- Respuesta definida o error manejado
**Estimación:** 1 SP

#### Test: should validate external API availability
**Tipo de prueba:** Integración externa
**Precondiciones:** APIs externas configuradas
**Datos de entrada:** N/A
**Pasos:**
1. Validar disponibilidad de APIs externas
**Resultados esperados:**
- Se loguea disponibilidad, no falla el test si no están disponibles
**Estimación:** 1 SP

---


## Carritos (`carts.spec.ts`)

### GET /carts - Get All Carts

#### Test: should successfully retrieve all carts
**Tipo de prueba:** Funcional positiva
**Precondiciones:** Carritos existentes
**Datos de entrada:** N/A
**Pasos:**
1. Enviar GET /carts
**Resultados esperados:**
- Status 200
- Respuesta es un array no vacío de carritos
- Cada carrito tiene los campos requeridos y productos válidos
**Estimación:** 1 SP

#### Test: should retrieve carts with limit and sort parameters
**Tipo de prueba:** Funcional positiva (parámetros)
**Precondiciones:** Carritos existentes
**Datos de entrada:** limit=3, sort='desc'
**Pasos:**
1. Enviar GET /carts?limit=3&sort=desc
**Resultados esperados:**
- Status 200
- Array de carritos con longitud <= 3
**Estimación:** 1 SP

#### Test: should handle invalid limit parameter gracefully
**Tipo de prueba:** Validación de parámetros
**Precondiciones:** N/A
**Datos de entrada:** limit=-1
**Pasos:**
1. Enviar GET /carts?limit=-1
**Resultados esperados:**
- Status 200
- Respuesta es un array
**Estimación:** 1 SP

### GET /carts/{id} - Get Cart by ID

#### Test: should successfully retrieve a specific cart
**Tipo de prueba:** Funcional positiva
**Precondiciones:** Carrito con ID 1 existe
**Datos de entrada:** id=1
**Pasos:**
1. Enviar GET /carts/1
**Resultados esperados:**
- Status 200
- Carrito con id=1 y campos requeridos
**Estimación:** 1 SP

#### Test: should return 404 for non-existent cart
**Tipo de prueba:** Negativa (no encontrado)
**Precondiciones:** ID no existente
**Datos de entrada:** id=99999
**Pasos:**
1. Enviar GET /carts/99999
**Resultados esperados:**
- Status 404
- Campo success es false
**Estimación:** 1 SP

#### Test: should handle invalid cart ID formats
**Tipo de prueba:** Validación de parámetros
**Precondiciones:** N/A
**Datos de entrada:** id=0, id=-1
**Pasos:**
1. Enviar GET /carts/0 y /carts/-1
**Resultados esperados:**
- Status 200 o 404
**Estimación:** 1 SP

### GET /carts/user/{userId} - Get Carts by User ID

#### Test: should successfully retrieve carts for user 2
**Tipo de prueba:** Funcional positiva
**Precondiciones:** Carritos para userId=2
**Datos de entrada:** userId=2
**Pasos:**
1. Enviar GET /carts/user/2
**Resultados esperados:**
- Status 200
- Todos los carritos tienen userId=2
**Estimación:** 1 SP

#### Test: should handle request for non-existent user
**Tipo de prueba:** Negativa (no encontrado)
**Precondiciones:** userId inexistente
**Datos de entrada:** userId=99999
**Pasos:**
1. Enviar GET /carts/user/99999
**Resultados esperados:**
- Status 200 o 404
**Estimación:** 1 SP

#### Test: should handle invalid user ID formats
**Tipo de prueba:** Validación de parámetros
**Precondiciones:** N/A
**Datos de entrada:** userId=0, userId=-1
**Pasos:**
1. Enviar GET /carts/user/0 y /carts/user/-1
**Resultados esperados:**
- Status 200, 400 o 404
**Estimación:** 1 SP

#### Test: should retrieve carts for multiple users and validate userId consistency
**Tipo de prueba:** Consistencia de datos
**Precondiciones:** Carritos para varios usuarios
**Datos de entrada:** userIds=[1,2,3]
**Pasos:**
1. Enviar GET /carts/user/{userId} para cada userId
**Resultados esperados:**
- Todos los carritos devueltos tienen el userId correspondiente
**Estimación:** 2 SP

### POST /carts - Create Cart

#### Test: should successfully create a new cart with valid data
**Tipo de prueba:** Funcional positiva (creación)
**Precondiciones:** N/A
**Datos de entrada:** Datos válidos de carrito
**Pasos:**
1. Enviar POST /carts con datos válidos
**Resultados esperados:**
- Status 200
- Carrito creado con id y datos correctos
**Estimación:** 2 SP

#### Test: should create cart with external date from WorldTimeAPI
**Tipo de prueba:** Integración externa
**Precondiciones:** WorldTimeAPI disponible
**Datos de entrada:** Fecha externa
**Pasos:**
1. Obtener fecha externa
2. Enviar POST /carts con esa fecha
**Resultados esperados:**
- Status 200
- Carrito creado con fecha externa
**Estimación:** 2 SP

#### Test: should create cart with generated random data
**Tipo de prueba:** Límite/aleatoriedad
**Precondiciones:** N/A
**Datos de entrada:** Datos aleatorios
**Pasos:**
1. Generar datos aleatorios
2. Enviar POST /carts
**Resultados esperados:**
- Status 200
- Carrito creado con id
**Estimación:** 2 SP

#### Test: should handle invalid cart data
**Tipo de prueba:** Validación de datos
**Precondiciones:** N/A
**Datos de entrada:** Datos inválidos
**Pasos:**
1. Enviar POST /carts con datos inválidos
**Resultados esperados:**
- Status 200 o 400
**Estimación:** 1 SP

#### Test: should handle cart data with invalid data types
**Tipo de prueba:** Validación de tipos
**Precondiciones:** N/A
**Datos de entrada:** Tipos incorrectos
**Pasos:**
1. Enviar POST /carts con tipos incorrectos
**Resultados esperados:**
- Status 200 o 400
**Estimación:** 1 SP

#### Test: should handle cart creation with invalid product structure
**Tipo de prueba:** Validación de estructura
**Precondiciones:** N/A
**Datos de entrada:** Estructura de productos inválida
**Pasos:**
1. Enviar POST /carts con productos mal estructurados
**Resultados esperados:**
- Status 200 o 400
**Estimación:** 1 SP

#### Test: should validate product quantities are positive numbers
**Tipo de prueba:** Validación de negocio
**Precondiciones:** N/A
**Datos de entrada:** Productos con cantidad negativa o cero
**Pasos:**
1. Enviar POST /carts con cantidades inválidas
**Resultados esperados:**
- Status 200 o 400
**Estimación:** 1 SP

### PUT /carts/{id} - Update Cart

#### Test: should successfully update an existing cart
**Tipo de prueba:** Funcional positiva (actualización)
**Precondiciones:** Carrito existente
**Datos de entrada:** id=1, datos válidos
**Pasos:**
1. Enviar PUT /carts/1 con datos válidos
**Resultados esperados:**
- Status 200
- Carrito actualizado con datos correctos
**Estimación:** 2 SP

#### Test: should successfully perform partial update of cart
**Tipo de prueba:** Actualización parcial
**Precondiciones:** Carrito existente
**Datos de entrada:** id=2, datos parciales
**Pasos:**
1. Enviar PUT /carts/2 con datos parciales
**Resultados esperados:**
- Status 200
- Carrito actualizado parcialmente
**Estimación:** 2 SP

#### Test: should handle update of non-existent cart
**Tipo de prueba:** Negativa (no encontrado)
**Precondiciones:** id inexistente
**Datos de entrada:** id=99999
**Pasos:**
1. Enviar PUT /carts/99999
**Resultados esperados:**
- Status 200 o 404
**Estimación:** 1 SP

#### Test: should handle invalid update data
**Tipo de prueba:** Validación de datos
**Precondiciones:** Carrito existente
**Datos de entrada:** Datos inválidos
**Pasos:**
1. Enviar PUT /carts/1 con datos inválidos
**Resultados esperados:**
- Status 200 o 400
**Estimación:** 1 SP

#### Test: should handle cart update with empty products array
**Tipo de prueba:** Validación de negocio
**Precondiciones:** Carrito existente
**Datos de entrada:** products=[]
**Pasos:**
1. Enviar PUT /carts/1 con products vacío
**Resultados esperados:**
- Status 200 o 400
**Estimación:** 1 SP

### DELETE /carts/{id} - Delete Cart

#### Test: should successfully delete an existing cart
**Tipo de prueba:** Funcional positiva (eliminación)
**Precondiciones:** Carrito existente
**Datos de entrada:** id=1
**Pasos:**
1. Enviar DELETE /carts/1
**Resultados esperados:**
- Status 200
- Carrito eliminado
**Estimación:** 1 SP

#### Test: should handle deletion of non-existent cart
**Tipo de prueba:** Negativa (no encontrado)
**Precondiciones:** id inexistente
**Datos de entrada:** id=99999
**Pasos:**
1. Enviar DELETE /carts/99999
**Resultados esperados:**
- Status 200 o 404
**Estimación:** 1 SP

#### Test: should handle invalid cart ID for deletion
**Tipo de prueba:** Validación de parámetros
**Precondiciones:** N/A
**Datos de entrada:** id=-1
**Pasos:**
1. Enviar DELETE /carts/-1
**Resultados esperados:**
- Status 200, 400 o 404
**Estimación:** 1 SP

#### Test: should verify cart deletion by attempting to retrieve deleted cart
**Tipo de prueba:** Validación de eliminación
**Precondiciones:** Carrito creado y eliminado
**Datos de entrada:** id de carrito recién creado
**Pasos:**
1. Crear carrito
2. Eliminar carrito
3. Intentar recuperar carrito eliminado
**Resultados esperados:**
- Status 200 o 404 al recuperar
**Estimación:** 2 SP

### GET /carts - Date Range Filtering

#### Test: should retrieve carts within specified date range
**Tipo de prueba:** Filtro de fechas
**Precondiciones:** Carritos con fechas en rango
**Datos de entrada:** startDate, endDate
**Pasos:**
1. Enviar GET /carts?startDate&endDate
**Resultados esperados:**
- Status 200
- Todas las fechas dentro del rango
**Estimación:** 2 SP

#### Test: should handle invalid date range formats
**Tipo de prueba:** Validación de parámetros
**Precondiciones:** N/A
**Datos de entrada:** Fechas inválidas
**Pasos:**
1. Enviar GET /carts con fechas inválidas
**Resultados esperados:**
- Status 200 o 400
**Estimación:** 1 SP

#### Test: should handle reversed date range (end before start)
**Tipo de prueba:** Validación de negocio
**Precondiciones:** N/A
**Datos de entrada:** startDate > endDate
**Pasos:**
1. Enviar GET /carts con fechas invertidas
**Resultados esperados:**
- Status 200 o 400
**Estimación:** 1 SP

### Data Validation and Business Logic

#### Test: should validate cart product IDs reference valid products
**Tipo de prueba:** Validación de negocio
**Precondiciones:** Carritos existentes
**Datos de entrada:** N/A
**Pasos:**
1. Obtener carritos y validar productId y quantity
**Resultados esperados:**
- Todos los productId > 0 y quantity > 0
**Estimación:** 1 SP

#### Test: should validate cart date formats are ISO strings
**Tipo de prueba:** Validación de formato
**Precondiciones:** Carritos existentes
**Datos de entrada:** N/A
**Pasos:**
1. Obtener carritos y validar formato de fecha
**Resultados esperados:**
- Fechas válidas y en formato ISO
**Estimación:** 1 SP

#### Test: should validate user IDs are positive integers
**Tipo de prueba:** Validación de negocio
**Precondiciones:** Carritos existentes
**Datos de entrada:** N/A
**Pasos:**
1. Obtener carritos y validar userId
**Resultados esperados:**
- Todos los userId son enteros positivos
**Estimación:** 1 SP

### Error Handling and Edge Cases

#### Test: should handle concurrent cart operations gracefully
**Tipo de prueba:** Concurrencia
**Precondiciones:** N/A
**Datos de entrada:** Datos válidos de carrito
**Pasos:**
1. Crear varios carritos en paralelo
**Resultados esperados:**
- Todas las respuestas son 200 o 400
**Estimación:** 2 SP

#### Test: should validate external API integration for dates
**Tipo de prueba:** Integración externa
**Precondiciones:** WorldTimeAPI configurada
**Datos de entrada:** N/A
**Pasos:**
1. Validar disponibilidad y obtener fecha externa
**Resultados esperados:**
- Fecha externa válida o test pasa si no disponible
**Estimación:** 1 SP

#### Test: should handle cart creation with duplicate product IDs
**Tipo de prueba:** Validación de negocio
**Precondiciones:** N/A
**Datos de entrada:** Productos con productId duplicado
**Pasos:**
1. Enviar POST /carts con productos duplicados
**Resultados esperados:**
- Status 200 o 400
**Estimación:** 1 SP

#### Test: should handle maximum products limit in cart
**Tipo de prueba:** Límite de datos
**Precondiciones:** N/A
**Datos de entrada:** 100 productos
**Pasos:**
1. Enviar POST /carts con 100 productos
**Resultados esperados:**
- Status 200, 400 o 413
**Estimación:** 2 SP

---


## Usuarios (`users.spec.ts`)

### GET /users - Get All Users

#### Test: should successfully retrieve all users
**Tipo de prueba:** Funcional positiva
**Precondiciones:** Usuarios existentes
**Datos de entrada:** N/A
**Pasos:**
1. Enviar GET /users
**Resultados esperados:**
- Status 200
- Respuesta es un array no vacío de usuarios
- Cada usuario tiene los campos requeridos y objetos anidados válidos
**Estimación:** 1 SP

#### Test: should retrieve users with limit and sort parameters
**Tipo de prueba:** Funcional positiva (parámetros)
**Precondiciones:** Usuarios existentes
**Datos de entrada:** limit=3, sort='desc'
**Pasos:**
1. Enviar GET /users?limit=3&sort=desc
**Resultados esperados:**
- Status 200
- Array de usuarios con longitud <= 3
**Estimación:** 1 SP

#### Test: should handle invalid limit parameter gracefully
**Tipo de prueba:** Validación de parámetros
**Precondiciones:** N/A
**Datos de entrada:** limit=-1
**Pasos:**
1. Enviar GET /users?limit=-1
**Resultados esperados:**
- Status 200
- Respuesta es un array
**Estimación:** 1 SP

### GET /users/{id} - Get User by ID

#### Test: should successfully retrieve a specific user
**Tipo de prueba:** Funcional positiva
**Precondiciones:** Usuario con ID 1 existe
**Datos de entrada:** id=1
**Pasos:**
1. Enviar GET /users/1
**Resultados esperados:**
- Status 200
- Usuario con id=1 y campos requeridos
**Estimación:** 1 SP

#### Test: should return 404 for non-existent user
**Tipo de prueba:** Negativa (no encontrado)
**Precondiciones:** ID no existente
**Datos de entrada:** id=99999
**Pasos:**
1. Enviar GET /users/99999
**Resultados esperados:**
- Status 404
- Campo success es false
**Estimación:** 1 SP

#### Test: should handle invalid user ID formats
**Tipo de prueba:** Validación de parámetros
**Precondiciones:** N/A
**Datos de entrada:** id=0, id=-1
**Pasos:**
1. Enviar GET /users/0 y /users/-1
**Resultados esperados:**
- Status 200 o 404
**Estimación:** 1 SP

### POST /users - Create User

#### Test: should successfully create a new user with valid data
**Tipo de prueba:** Funcional positiva (creación)
**Precondiciones:** N/A
**Datos de entrada:** Datos válidos de usuario
**Pasos:**
1. Enviar POST /users con datos válidos
**Resultados esperados:**
- Status 200
- Usuario creado con id y datos coinciden
**Estimación:** 2 SP

#### Test: should create user with external data from JSONPlaceholder API
**Tipo de prueba:** Integración externa
**Precondiciones:** API JSONPlaceholder disponible
**Datos de entrada:** Datos externos
**Pasos:**
1. Obtener datos externos
2. Enviar POST /users con esos datos
**Resultados esperados:**
- Status 200
- Usuario creado con datos externos
**Estimación:** 2 SP

#### Test: should create user with generated random data
**Tipo de prueba:** Límite/aleatoriedad
**Precondiciones:** N/A
**Datos de entrada:** Datos aleatorios
**Pasos:**
1. Generar datos aleatorios
2. Enviar POST /users
**Resultados esperados:**
- Status 200
- Usuario creado con id
**Estimación:** 2 SP

#### Test: should handle invalid user data
**Tipo de prueba:** Validación de datos
**Precondiciones:** N/A
**Datos de entrada:** Datos inválidos
**Pasos:**
1. Enviar POST /users con datos inválidos
**Resultados esperados:**
- Status 200 o 400
**Estimación:** 1 SP

#### Test: should handle user data with invalid data types
**Tipo de prueba:** Validación de tipos
**Precondiciones:** N/A
**Datos de entrada:** Tipos incorrectos
**Pasos:**
1. Enviar POST /users con tipos incorrectos
**Resultados esperados:**
- Status 200 o 400
**Estimación:** 1 SP

#### Test: should handle user creation with invalid email formats
**Tipo de prueba:** Validación de formato
**Precondiciones:** N/A
**Datos de entrada:** Emails inválidos
**Pasos:**
1. Enviar POST /users con emails inválidos
**Resultados esperados:**
- Status 200 o 400
**Estimación:** 1 SP

#### Test: should handle user creation with edge case strings
**Tipo de prueba:** Límite de datos
**Precondiciones:** N/A
**Datos de entrada:** Strings vacíos, espacios, etc.
**Pasos:**
1. Enviar POST /users con strings edge case
**Resultados esperados:**
- Status 200 o 400
**Estimación:** 1 SP

### PUT /users/{id} - Update User

#### Test: should successfully update an existing user
**Tipo de prueba:** Funcional positiva (actualización)
**Precondiciones:** Usuario existente
**Datos de entrada:** id=1, datos válidos
**Pasos:**
1. Enviar PUT /users/1 con datos válidos
**Resultados esperados:**
- Status 200
- Usuario actualizado con datos correctos
**Estimación:** 2 SP

#### Test: should successfully perform partial update of user
**Tipo de prueba:** Actualización parcial
**Precondiciones:** Usuario existente
**Datos de entrada:** id=2, datos parciales
**Pasos:**
1. Enviar PUT /users/2 con datos parciales
**Resultados esperados:**
- Status 200
- Usuario actualizado parcialmente
**Estimación:** 2 SP

#### Test: should handle update of non-existent user
**Tipo de prueba:** Negativa (no encontrado)
**Precondiciones:** id inexistente
**Datos de entrada:** id=99999
**Pasos:**
1. Enviar PUT /users/99999
**Resultados esperados:**
- Status 200 o 404
**Estimación:** 1 SP

#### Test: should handle invalid update data
**Tipo de prueba:** Validación de datos
**Precondiciones:** Usuario existente
**Datos de entrada:** Datos inválidos
**Pasos:**
1. Enviar PUT /users/1 con datos inválidos
**Resultados esperados:**
- Status 200 o 400
**Estimación:** 1 SP

### DELETE /users/{id} - Delete User

#### Test: should successfully delete an existing user
**Tipo de prueba:** Funcional positiva (eliminación)
**Precondiciones:** Usuario existente
**Datos de entrada:** id=1
**Pasos:**
1. Enviar DELETE /users/1
**Resultados esperados:**
- Status 200
- Usuario eliminado
**Estimación:** 1 SP

#### Test: should handle deletion of non-existent user
**Tipo de prueba:** Negativa (no encontrado)
**Precondiciones:** id inexistente
**Datos de entrada:** id=99999
**Pasos:**
1. Enviar DELETE /users/99999
**Resultados esperados:**
- Status 200 o 404
**Estimación:** 1 SP

#### Test: should handle invalid user ID for deletion
**Tipo de prueba:** Validación de parámetros
**Precondiciones:** N/A
**Datos de entrada:** id=-1
**Pasos:**
1. Enviar DELETE /users/-1
**Resultados esperados:**
- Status 200, 400 o 404
**Estimación:** 1 SP

### Data Validation and Constraints

#### Test: should validate email format in user responses
**Tipo de prueba:** Validación de formato
**Precondiciones:** Usuarios existentes
**Datos de entrada:** N/A
**Pasos:**
1. Obtener usuarios y validar formato de email
**Resultados esperados:**
- Todos los emails cumplen formato válido
**Estimación:** 1 SP

#### Test: should validate phone number format in user responses
**Tipo de prueba:** Validación de formato
**Precondiciones:** Usuarios existentes
**Datos de entrada:** N/A
**Pasos:**
1. Obtener usuarios y validar formato de teléfono
**Resultados esperados:**
- Todos los teléfonos son strings no vacíos
**Estimación:** 1 SP

#### Test: should validate geolocation coordinates format
**Tipo de prueba:** Validación de formato
**Precondiciones:** Usuario existente
**Datos de entrada:** id=1
**Pasos:**
1. Obtener usuario y validar latitud/longitud
**Resultados esperados:**
- Latitud entre -90 y 90, longitud entre -180 y 180
**Estimación:** 1 SP

### Error Handling and Edge Cases

#### Test: should handle malformed JSON in request body
**Tipo de prueba:** Manejo de errores
**Precondiciones:** N/A
**Datos de entrada:** JSON malformado
**Pasos:**
1. Enviar POST /users con datos no objeto
**Resultados esperados:**
- Status 200 o 400, o error manejado
**Estimación:** 1 SP

#### Test: should validate external API integration resilience
**Tipo de prueba:** Integración externa
**Precondiciones:** APIs externas configuradas
**Datos de entrada:** N/A
**Pasos:**
1. Validar disponibilidad de APIs externas
2. Obtener datos externos y crear usuario
**Resultados esperados:**
- Se loguea disponibilidad, no falla el test si no están disponibles
**Estimación:** 1 SP


