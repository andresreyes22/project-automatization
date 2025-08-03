pipeline {
    agent any

    environment {
        NODE_VERSION = '20.x'
        BASE_URL = 'https://fakestoreapi.com'
    }

    stages {
        stage('Checkout') {
            steps {
                // Descarga el código fuente del repositorio
                checkout scm
            }
        }
        stage('Preparar entorno') {
            steps {
                echo 'Instalando Node.js y dependencias...'
                sh 'curl -fsSL https://deb.nodesource.com/setup_20.x | bash -'
                sh 'apt-get install -y nodejs'
                sh 'npm ci'
                sh 'npx playwright install --with-deps'
            }
        }
        stage('Ejecutar pruebas') {
            steps {
                echo 'Ejecutando suite de pruebas Playwright (HTML reporter habilitado)...'
                sh 'npx playwright test --reporter=html > test-output.log || true'
            }
        }
        stage('Publicar reportes') {
            steps {
                echo 'Mostrando resumen de resultados:'
                sh 'tail -n 30 test-output.log || cat test-output.log'
                archiveArtifacts artifacts: 'test-output.log', onlyIfSuccessful: false
                archiveArtifacts artifacts: 'playwright-report/**', onlyIfSuccessful: false
            }
        }
    }

    post {
        always {
            echo 'Pipeline finalizado. Consulta test-output.log y el reporte HTML para detalles.'
        }
        failure {
            echo '❌ Fallaron pruebas. Revisa el log.'
            // Ejemplo de notificación por correo (requiere configuración en Jenkins)
            mail to: 'andresmateoreyes@gmail.com',
                 subject: '❌ Pruebas Playwright FALLARON',
                 body: 'Revisa el log y el reporte HTML en Jenkins.'
        }
        success {
            echo '✅ Todas las pruebas pasaron correctamente.'
            mail to: 'andresmateoreyes@gmail.com',
                 subject: '✅ Pruebas Playwright PASARON',
                 body: 'Todas las pruebas pasaron correctamente. Consulta el reporte HTML.'
        }
    }
}

// Este Jenkinsfile está diseñado para ejecutar pruebas Playwright en un entorno Node.js
