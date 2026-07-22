pipeline {
    agent any

    environment {
        AWS_ACCOUNT_ID = 'your-aws-account-id'
        AWS_DEFAULT_REGION = 'us-east-1'
        ECR_REGISTRY = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com"
        IMAGE_TAG = "${BUILD_NUMBER}"
        EKS_CLUSTER_NAME = 'payflow-cluster'
    }

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

        stage('Docker Build & ECR Push') {
            steps {
                script {
                    // Login to AWS ECR
                    sh "aws ecr get-login-password --region ${AWS_DEFAULT_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}"

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
                        sh "docker build -t ${ECR_REGISTRY}/payflow-${name}:${IMAGE_TAG} -t ${ECR_REGISTRY}/payflow-${name}:latest ${context}"
                        
                        echo "Pushing Docker image for ${name} to ECR..."
                        sh "docker push ${ECR_REGISTRY}/payflow-${name}:${IMAGE_TAG}"
                        sh "docker push ${ECR_REGISTRY}/payflow-${name}:latest"
                    }
                }
            }
        }

        stage('Deploy to EKS') {
            steps {
                script {
                    // Authenticate kubectl with AWS EKS
                    sh "aws eks update-kubeconfig --region ${AWS_DEFAULT_REGION} --name ${EKS_CLUSTER_NAME}"
                    
                    // Replace place-holder registry in manifest and apply
                    sh "sed -i 's|raquibulhasharshad/payflow-|${ECR_REGISTRY}/payflow-|g' k8s-deployment.yaml"
                    sh "kubectl apply -f k8s-deployment.yaml"
                    
                    // Force rollout restart to fetch new images
                    def services = ['discovery-server', 'api-gateway', 'auth-service', 'wallet-service', 'transaction-service', 'rewards-service', 'notification-service', 'frontend']
                    services.each { name ->
                        sh "kubectl rollout restart deployment/${name}"
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
