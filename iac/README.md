# Infrastructure as Code (CDK for Terraform)

This folder contains a CDK for Terraform (CDKTF) project written in TypeScript.  
It defines AWS infrastructure including a VPC, subnets, security groups, an ECR repository, IAM roles, an ECS Fargate service, and CloudWatch logging.  
All configuration is fully abstracted using environment variables and `cdktf.json`—no AWS account IDs or credentials are hardcoded.

---

## Prerequisites

- Node.js 18+
- Terraform CLI
- CDKTF CLI (`npm install -g cdktf-cli`)
- AWS credentials configured using one of:
  - `aws configure`
  - Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`)
  - `.env` file loaded before running commands

---

## Configuration

Set the required environment variables before deploying:

```bash
export AWS_REGION=us-east-1
export APP_NAME=express-app
