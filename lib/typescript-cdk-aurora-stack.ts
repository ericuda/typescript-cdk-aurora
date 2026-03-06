import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class CdkTypescriptLabStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Look up existing VPC by ID
    const vpc = ec2.Vpc.fromLookup(this, 'Vpc', {
      vpcId: 'vpc-f694928c',
    });

    // Create private subnets across 2 AZs
    const privateSubnet1 = new ec2.PrivateSubnet(this, 'cdk-private-subnet1', {
      vpcId: vpc.vpcId,
      cidrBlock: '172.31.96.0/20',
      availabilityZone: vpc.availabilityZones[0],
    });

    const privateSubnet2 = new ec2.PrivateSubnet(this, 'cdk-private-subnet2', {
      vpcId: vpc.vpcId,
      cidrBlock: '172.31.112.0/20',
      availabilityZone: vpc.availabilityZones[1],
    });

    const cluster = new rds.ServerlessCluster(this, 'Aurora-Test-Cluster', {
      engine: rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
      copyTagsToSnapshot: true,
      parameterGroup: rds.ParameterGroup.fromParameterGroupName(this, 'ParameterGroup', 'default.aurora-postgresql11'),
      vpc,
      scaling: {
        autoPause: Duration.minutes(10),
        minCapacity: rds.AuroraCapacityUnit.ACU_8,
        maxCapacity: rds.AuroraCapacityUnit.ACU_32,
        timeout: Duration.seconds(100),
        timeoutAction: rds.TimeoutAction.FORCE_APPLY_CAPACITY_CHANGE
      }
    });
  }
}
