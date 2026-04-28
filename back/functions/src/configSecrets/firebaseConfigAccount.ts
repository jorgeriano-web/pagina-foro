import { defineSecret } from "firebase-functions/params";

/** Secreto enlazado en callables/schedulers y leído en `accFireBaseConfig`. */
export const FIREBASE_CONFIG_ACCOUNT = defineSecret(
  "service-account-transacciones-inmobiliarias"
);

export async function accFireBaseConfig() {
    const datosAcc = FIREBASE_CONFIG_ACCOUNT.value();

    return JSON.parse(datosAcc)
}