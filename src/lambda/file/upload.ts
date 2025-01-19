import { Handler } from "aws-cdk-lib/aws-lambda";
import { APIGatewayProxyEvent, APIGatewayProxyResultV2 } from "aws-lambda";

export const handler: Handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResultV2> => {
  console.log("event", event);
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Hello from Lambda!",
      input: event,
    }),
  };
};
