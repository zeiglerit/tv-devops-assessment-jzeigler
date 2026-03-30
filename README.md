# Deployment Documentation

This repository contains two components:

- `app/` — A containerized Express application with a CI workflow.
- `iac/` — CDK for Terraform (CDKTF) infrastructure that deploys AWS resources including a VPC, subnets, security groups, ECR repository, IAM roles, ECS Fargate cluster, and service.

This document explains how to configure the infrastructure for your AWS environment, which variables to override, and how to deploy or destroy the stack.

---

## 1. Configure/bootstrap for Your AWS Environment

Before deploying, authenticate to AWS using one of the supported methods.

### AWS CLI (recommended)

```bash
aws configure

export AWS_REGION="us-east-1"
export APP_NAME="express-app"
export REPO_NAME="${APP_NAME}-repo"
aws ecr create-repository --repository-name $REPO_NAME

## 2. Deploy ts app

cd iac/
npm install
npx cdktf get
npx cdktf synth
npx cdktf deploy


## 3. Build and push container

aws ecr get-login-password --region $AWS_REGION \
  | docker login --username AWS --password-stdin $ECR_URI
cd ../app
docker build -t $REPO_NAME .
docker tag $REPO_NAME:latest $ECR_URI:latest
docker push $ECR_URI:latest


