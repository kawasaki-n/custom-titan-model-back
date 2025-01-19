import * as path from "path";
import * as cdk from "aws-cdk-lib";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Code, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import {
  BlockPublicAccess,
  Bucket,
  BucketAccessControl,
  BucketEncryption,
  ObjectOwnership,
} from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod,
} from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";

export class BackStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const accountId = cdk.Stack.of(this).account;
    const region = cdk.Stack.of(this).region;

    const bucket = new Bucket(this, `CustomTitanModelBucket`, {
      bucketName: `custom-titan-model-bucket-${accountId}-${region}`,
      accessControl: BucketAccessControl.PRIVATE,
      objectOwnership: ObjectOwnership.BUCKET_OWNER_PREFERRED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: BucketEncryption.KMS_MANAGED,
    });
    const bucketFullAccessPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["s3:*"],
      resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
    });

    const fileUploadFunction = new NodejsFunction(
      this,
      "CustomTitanModel_FileUploadFunction",
      {
        functionName: `CustomTitanModel-FileUploadFunction`,
        code: Code.fromAsset(path.join(__dirname, `../src/lambda/file`)),
        handler: "upload.handler",
        timeout: cdk.Duration.seconds(60),
        environment: {
          S3_BUCKET_NAME: bucket.bucketName,
        },
      }
    );

    const api = new HttpApi(this, "CustomTitanModelApi", {
      apiName: "CustomTitanModelApi",
      corsPreflight: {
        allowHeaders: ["*"],
        allowOrigins: ["*"],
        allowMethods: [CorsHttpMethod.ANY],
      },
    });
    api.addRoutes({
      path: "/api/file/upload",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        "FileUploadLambdaIntegration",
        fileUploadFunction
      ),
    });
  }
}
