import { defineSecret } from "firebase-functions/params";


const FIREBASE_ACCOUNT_CREDENTIALS = defineSecret("service-account-transacciones-inmobiliarias");

export async function accFireBaseConfig(){
    const datosAcc = FIREBASE_ACCOUNT_CREDENTIALS.value();

    return JSON.parse(datosAcc)
}