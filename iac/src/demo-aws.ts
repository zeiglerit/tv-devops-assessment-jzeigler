import { Construct } from "constructs";
import { TerraformStack } from "cdktf";

import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { DataAwsCallerIdentity } from "@cdktf/provider-aws/lib/data-aws-caller-identity";

// VPC
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";

// Routing
import { InternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";
import { RouteTable } from "@cdktf/provider-aws/lib/route-table";
import { Route } from "@cdktf/provider-aws/lib/route";
import { RouteTableAssociation } from "@cdktf/provider-aws/lib/route-table-association";

// EC2
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";

// ECR
import { EcrRepository } from "@cdktf/provider-aws/lib/ecr-repository";

// IAM
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";

// CloudWatch Logs
import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";

// ECS
import { EcsCluster } from "@cdktf/provider-aws/lib/ecs-cluster";
import { EcsTaskDefinition } from "@cdktf/provider-aws/lib/ecs-task-definition";
import { EcsService } from "@cdktf/provider-aws/lib/ecs-service";

export class MyDemo extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const region = process.env.AWS_REGION ?? "us-east-1";
    const appName = process.env.APP_NAME ?? "express-app";

    new AwsProvider(this, "aws", { region });

    // -----------------------------
    // AWS Account Identity (for portability)
    // -----------------------------
    const identity = new DataAwsCallerIdentity(this, "identity");

    // -----------------------------
    // VPC
    // -----------------------------
    const mainVpc = new Vpc(this, "mainVpc", {
      cidrBlock: "10.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // -----------------------------
    // Public Subnet
    // -----------------------------
    const publicSubnet = new Subnet(this, "publicSubnet", {
      vpcId: mainVpc.id,
      cidrBlock: "10.0.1.0/24",
      mapPublicIpOnLaunch: true,
    });

    // -----------------------------
    // Internet Gateway
    // -----------------------------
    const igw = new InternetGateway(this, "igw", {
      vpcId: mainVpc.id,
    });

    // -----------------------------
    // Route Table
    // -----------------------------
    const publicRouteTable = new RouteTable(this, "publicRouteTable", {
      vpcId: mainVpc.id,
    });

    // Default route to the internet
    new Route(this, "publicDefaultRoute", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.id,
    });

    // Associate route table with public subnet
    new RouteTableAssociation(this, "publicSubnetAssociation", {
      subnetId: publicSubnet.id,
      routeTableId: publicRouteTable.id,
    });

    // -----------------------------
    // Security Group
    // -----------------------------
    const ecsSecurityGroup = new SecurityGroup(this, "ecsSecurityGroup", {
      vpcId: mainVpc.id,
      description: "Allow ECS task traffic",
      ingress: [
        {
          fromPort: 3000,
          toPort: 3000,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],
    });

    // -----------------------------
    // ECR Repository (portable)
    // -----------------------------
    const repo = new EcrRepository(this, "ecrRepo", {
      name: `${appName}-${identity.accountId}-repo`,
      forceDelete: true,
    });

    // -----------------------------
    // IAM Roles
    // -----------------------------
    const executionRole = new IamRole(this, "executionRole", {
      name: `${appName}-execution-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { Service: "ecs-tasks.amazonaws.com" },
            Action: "sts:AssumeRole",
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, "executionRolePolicy", {
      role: executionRole.name,
      policyArn:
        "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
    });

    const taskRole = new IamRole(this, "taskRole", {
      name: `${appName}-task-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { Service: "ecs-tasks.amazonaws.com" },
            Action: "sts:AssumeRole",
          },
        ],
      }),
    });

    // -----------------------------
    // CloudWatch Logs
    // -----------------------------
    const logGroup = new CloudwatchLogGroup(this, "logGroup", {
      name: `/ecs/${appName}`,
      retentionInDays: 7,
    });

    // -----------------------------
    // ECS Cluster
    // -----------------------------
    const cluster = new EcsCluster(this, "ecsCluster", {
      name: `${appName}-cluster`,
    });

    // -----------------------------
    // ECS Task Definition
    // -----------------------------
    const taskDef = new EcsTaskDefinition(this, "taskDef", {
      family: `${appName}-task`,
      networkMode: "awsvpc",
      requiresCompatibilities: ["FARGATE"],
      cpu: "256",
      memory: "512",
      executionRoleArn: executionRole.arn,
      taskRoleArn: taskRole.arn,
      containerDefinitions: JSON.stringify([
        {
          name: "app",
          image: `${repo.repositoryUrl}:latest`,
          essential: true,
          portMappings: [
            {
              containerPort: 3000,
              hostPort: 3000,
            },
          ],
          logConfiguration: {
            logDriver: "awslogs",
            options: {
              "awslogs-group": logGroup.name,
              "awslogs-region": region,
              "awslogs-stream-prefix": "ecs",
            },
          },
        },
      ]),
    });

    // -----------------------------
    // ECS Service
    // -----------------------------
    new EcsService(this, "ecsService", {
      name: `${appName}-service`,
      cluster: cluster.id,
      taskDefinition: taskDef.arn,
      desiredCount: 1,
      launchType: "FARGATE",
      networkConfiguration: {
        subnets: [publicSubnet.id],
        securityGroups: [ecsSecurityGroup.id],
        assignPublicIp: true,
      },
    });
  }
}
