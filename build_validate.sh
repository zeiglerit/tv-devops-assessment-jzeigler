#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${APP_NAME:-express-app}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "🔍 Validating ECS deployment for: $APP_NAME in $AWS_REGION"

CLUSTER_NAME="${APP_NAME}-cluster"
SERVICE_NAME="${APP_NAME}-service"

echo "📌 Cluster: $CLUSTER_NAME"
echo "📌 Service: $SERVICE_NAME"

# -----------------------------
# 1. Describe service
# -----------------------------
echo "📡 Fetching ECS service status..."
aws ecs describe-services \
  --cluster "$CLUSTER_NAME" \
  --services "$SERVICE_NAME" \
  --region "$AWS_REGION" \
  --output table

# -----------------------------
# 2. Get running task
# -----------------------------
TASK_ARN=$(aws ecs list-tasks \
  --cluster "$CLUSTER_NAME" \
  --service-name "$SERVICE_NAME" \
  --region "$AWS_REGION" \
  --query "taskArns[0]" \
  --output text)

if [[ "$TASK_ARN" == "None" || -z "$TASK_ARN" ]]; then
  echo "❌ No running tasks found. The service may be failing to start."
  exit 1
fi

echo "📌 Task ARN: $TASK_ARN"

# -----------------------------
# 3. Describe task
# -----------------------------
aws ecs describe-tasks \
  --cluster "$CLUSTER_NAME" \
  --tasks "$TASK_ARN" \
  --region "$AWS_REGION" \
  --output table

# -----------------------------
# 4. Get ENI → Public IP
# -----------------------------
ENI_ID=$(aws ecs describe-tasks \
  --cluster "$CLUSTER_NAME" \
  --tasks "$TASK_ARN" \
  --region "$AWS_REGION" \
  --query "tasks[0].attachments[0].details[?name=='networkInterfaceId'].value" \
  --output text)

echo "📌 ENI: $ENI_ID"

PUBLIC_IP=$(aws ec2 describe-network-interfaces \
  --network-interface-ids "$ENI_ID" \
  --region "$AWS_REGION" \
  --query "NetworkInterfaces[0].Association.PublicIp" \
  --output text)

echo "🌐 Public IP: $PUBLIC_IP"

# -----------------------------
# 5. Test health endpoint
# -----------------------------
echo "🔎 Checking health endpoint..."
curl -v "http://${PUBLIC_IP}:3000/health" || {
  echo "❌ Health check failed"
  exit 1
}

echo "🎉 Health check passed!"

# -----------------------------
# 6. Show logs
# -----------------------------
LOG_GROUP="/ecs/${APP_NAME}"

echo "📜 Recent logs:"
aws logs tail "$LOG_GROUP" \
  --region "$AWS_REGION" \
  --since 5m
