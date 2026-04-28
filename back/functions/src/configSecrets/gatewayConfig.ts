import { defineSecret } from "firebase-functions/params";


const GATEWAY_CREDENTIALS_DEV = defineSecret("gateway-credentials-dev");

const GATEWAY_CREDENTIALS_PROD = defineSecret("gateway-credentials-prod");

/** Alias del secreto prod para `onCall` / `onSchedule` (mismo que usa `getGatewayConfig("prod")`). */
export const GATEWAY_CREDENTIALS = GATEWAY_CREDENTIALS_PROD;

export async function getGatewayConfig(env: "dev" | "prod") {
  const secretParam =
    env === "dev"
      ? GATEWAY_CREDENTIALS_DEV
      : GATEWAY_CREDENTIALS_PROD;

  const raw = await secretParam.value();
  return JSON.parse(raw);
}
