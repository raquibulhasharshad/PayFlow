pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend') {
            steps {
                dir('Backend') {
                    sh 'mvn clean package -DskipTests'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('Frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Docker Build & Import') {
            steps {
                script {
                    def services = [
                        'discovery-server': './Backend/discovery-server',
                        'api-gateway': './Backend/api-gateway',
                        'auth-service': './Backend/auth-service',
                        'wallet-service': './Backend/wallet-service',
                        'transaction-service': './Backend/transaction-service',
                        'rewards-service': './Backend/rewards-service',
                        'notification-service': './Backend/notification-service',
                        'frontend': './Frontend'
                    ]

                    services.each { name, context ->
                        echo "Building Docker image for ${name}..."
                        sh "docker build -t raquibulhasharshad/payflow-${name}:latest ${context}"
                        
                        echo "Importing Docker image for ${name} into K3s..."
                        sh "docker save raquibulhasharshad/payflow-${name}:latest | sudo k3s ctr -n=k8s.io images import -"
                    }
                }
            }
        }

        stage('Deploy to K3s') {
            steps {
                script {
                    echo "Applying Kubernetes manifests..."
                    sh "sudo kubectl apply -f k8s-deployment.yaml"
                    
                    // Force rollout restart to fetch new images
                    def services = ['discovery-server', 'api-gateway', 'auth-service', 'wallet-service', 'transaction-service', 'rewards-service', 'notification-service', 'frontend']
                    services.each { name ->
                        sh "sudo kubectl rollout restart deployment/${name}"
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Deployment completed successfully!"
        }
        failure {
            echo "Deployment failed."
        }
    }
}

