import { defineSecret } from "firebase-functions/params";

/** Secreto enlazado en `onCall` / `onSchedule` y leído en `emailSendConfig`. */
export const EMAIL_CREDENTIALS = defineSecret("email-credentials");

export async function emailSendConfig(){
    const datosEmail = EMAIL_CREDENTIALS.value()

    return JSON.parse(datosEmail)

}