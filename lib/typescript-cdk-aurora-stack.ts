import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';

export class TypescriptCdkAuroraStack extends cdk.Stack {
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

    const cluster = new rds.DatabaseCluster(this, 'Aurora-Test-Cluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({ version: rds.AuroraPostgresEngineVersion.VER_17_7}),
      copyTagsToSnapshot: true,
      writer: rds.ClusterInstance.provisioned('writer', {
        publiclyAccessible: false,
      }),
      // parameterGroup: rds.ParameterGroup.fromParameterGroupName(this, 'ParameterGroup', 'default.aurora-postgresql11'),
      vpc,
      vpcSubnets: { subnets: [privateSubnet1, privateSubnet2] },
      iamAuthentication: true,
      deletionProtection: true,
    });

    const dbrole = new iam.Role(this, 'DBRole', { 
      assumedBy: new iam.ServicePrincipal('rds.amazonaws.com') 
    }); 
    cluster.grantConnect(dbrole, 'somedbuser');
  }
}
