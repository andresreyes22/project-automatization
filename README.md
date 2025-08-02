

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


