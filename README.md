# Deployment Documentation

This repository contains two components:

- `app/` — A containerized Express application with a CI workflow.
- `iac/` — CDK for Terraform (CDKTF) infrastructure that deploys AWS resources including a VPC, subnets, security groups, ECR repository, IAM roles, ECS Fargate cluster, and service.

This document explains how to configure the infrastructure for your AWS environment, which variables to override, and how to deploy or destroy the stack.

---

## 1. Configure for Your AWS Environment

Before deploying, authenticate to AWS using one of the supported methods.

### Option A — AWS CLI (recommended)

```bash
aws configure
