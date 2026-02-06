
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import axios from "axios";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { agregarFilaAsheet } from "./service/sheetService";
import { enviarEmail } from "./service/emailService";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { PreciosService } from "./service/preciosService";
import { getGatewayConfig } from "./configSecrets/gatewayConfig";
import { defineSecret } from "firebase-functions/params";

admin.initializeApp();

const db = getFirestore("payments-foro-inmobiliario");


const GATEWAY_CREDENTIALS= defineSecret("gateway-credentials-prod");
const EMAIL_CREDENTIALS = defineSecret("email-credentials");
const FIREBASE_CONFIG_ACCOUNT = defineSecret("service-account-transacciones-inmobiliarias")

// ============================================

interface AsistenteData{
  nombre: string;
  telefono: string;
  numDoc: string;
  correo: string;
}

interface InmobiliariaData{
  poliza: string;
  inmobiliaria: string;
  ciudad: string;
  ejecutivo: string;
}

interface Facturacion {
  tipoDoc: string;
  numDoc: string;
  nombre: string;
  correo: string;
}

interface PagoRequest {
  esCliente: boolean;                  // true = cliente Bolívar, false = no cliente
  inmobiliaria?: InmobiliariaData;     // Solo si es cliente
  asistentes: AsistenteData[];         // Array de 1, 2 o 3 asistentes
  facturacion: Facturacion;
  cantidad_boletas: number;
}

// FUNCIÓN: OBTENER TOKEN
// ============================================

async function obtenerToken(): Promise<string> {
  try {

    const gateway = await getGatewayConfig("prod")

    const response = await axios.post(
      `${gateway.baseUrl}/load/compare`,
      {
        user: gateway.user,
        pass: gateway.pass,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    return response.data.token;
  } catch (error) {
    console.error("Error obteniendo token:", error);
    throw new HttpsError("internal", "Error al autenticar con el gateway");
  }
}

// ============================================
// FUNCIÓN PRINCIPAL: CREAR LINK DE PAGO
// ============================================

export const crearLinkPagoProd = onCall({ cors: true, secrets: [GATEWAY_CREDENTIALS] }, async (request) => {
  const data = request.data as PagoRequest;


  // Validar datos
  if (!data.asistentes || !data.facturacion) {
    throw new HttpsError("invalid-argument", "Faltan datos requeridos");
  }

  if(data.asistentes.length !== data.cantidad_boletas){
    throw new HttpsError("invalid-argument", "Número de asistentes no coincide con la cantidad de boletas");
  }

  try {

    const gateway = await getGatewayConfig("prod");

    const preciosService = new PreciosService();
    const precioReal = preciosService.seleccionarBoletasYprecio(data.cantidad_boletas);

    // 1. Obtener token
    const token = await obtenerToken();

    // 2. Preparar datos para el gateway
    let payloadGateway;
    if(data.esCliente && data.inmobiliaria){

      // es cliente
      payloadGateway = {
        name: data.inmobiliaria.inmobiliaria,
        last_name: data.inmobiliaria.inmobiliaria,
        phone: data.asistentes[0].telefono,
        email: data.asistentes[0].correo,
        id: data.facturacion.numDoc,
        id_type: data.facturacion.tipoDoc,
        amount: precioReal,
        description: `Compra de ${data.cantidad_boletas} boleta(s)`,
        vat: 0,
        url_return: "https://foro-inmobiliarias01.web.app/pagoExitoso",
        url_return_problem: "https://foro-inmobiliarias01.web.app/pagoNoExitoso",
        department: data.inmobiliaria.ciudad,
        quantity: 30,
        period: "minutes",
      }
    } else{
      // NO CLIENTE
      payloadGateway = {
        name: data.facturacion.nombre,
        last_name: data.facturacion.nombre,
        phone: data.asistentes[0].telefono,
        email: data.asistentes[0].correo,
        id: data.facturacion.numDoc,
        id_type: data.facturacion.tipoDoc,
        amount: precioReal,
        description: `Compra de ${data.cantidad_boletas} boleta(s)`,
        vat: 0,
        url_return: "https://foro-inmobiliarias01.web.app/pagoExitoso",
        url_return_problem: "https://foro-inmobiliarias01.web.app/pagoNoExitoso",
        quantity: 30,
        period: "minutes",       
      };
    }

    // 3. Generar link de pago
    console.log("🔗 Generando link de pago...");
    const response = await axios.post(
      `${gateway.baseUrl}/api/generate-link-manual`,
      payloadGateway,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    //console.log("📦 RESPUESTA GATEWAY COMPLETA:", response.data);



    // 4. Guardar en Firestore
    const transaccionRef = await db.collection("transacciones").add({
      esCliente: data.esCliente,
      inmobiliaria: data.inmobiliaria || null,
      asistentes: data.asistentes,
      cantidad_boletas: data.cantidad_boletas,
      precio_total: precioReal,
      referencia: response.data.reference,
      estado: "PENDIENTE",
      fecha_creacion: FieldValue.serverTimestamp(),
      guardadoEnSheet: false,   
    });


    // 5. Devolver respuesta
    return {
      success: true,
      payLink: response.data.pay_link,
      shortLink: response.data.short_link,
      referencia: response.data.reference,
      transaccionId: transaccionRef.id,
    };

  } catch (error: any) {
    console.error("❌ Error:", error.response?.data || error.message);
    throw new HttpsError("internal", "Error al generar el link de pago");
  }
});


// ============================================
// VERIFICAR PAGOS PENDIENTES AUTOMÁTICAMENTE
// ============================================

export const verificarPagosPendientesProd = onSchedule(
  {
    schedule: "every 6 hours",
    secrets: [
      GATEWAY_CREDENTIALS, 
      EMAIL_CREDENTIALS,     // <- secreto de emails
      FIREBASE_CONFIG_ACCOUNT // <- secreto de Sheets
    ],
  },
  async (event) => {
    console.log("🔍 Iniciando verificación automática...");

    try {

      const gateway = await getGatewayConfig("prod");

      const snapshot = await db
        .collection("transacciones")
        .where("estado", "==", "PENDIENTE")
        .get();

      console.log(`📊 Transacciones pendientes encontradas: ${snapshot.size}`);

      if (snapshot.empty) {
        console.log("✅ No hay pagos pendientes");
        return;
      }

      // Obtener token una sola vez
      const token = await obtenerToken();

      // Verificar cada transacción
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const referencia = data.referencia;

        try {
          // Consultar estado en el gateway
          const response = await axios.get(
            `${gateway.baseUrl}/views/check-status?dev_reference=${referencia}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          const estadoGateway = response.data?.data?.status;
          //console.log(`📌 ${referencia}: ${estadoGateway}`);

          // ✅ SI ESTÁ APROBADO
          if (response.data.success && estadoGateway === "APROBADO") {
            
            // 1. Actualizar Firestore
            await doc.ref.update({
              estado: "APROBADO",
              fecha_pago: FieldValue.serverTimestamp(),
            });
            //console.log(`✅ Firestore actualizado: ${referencia}`);

            // 2. Guardar en Sheets (SOLO si no se ha guardado)
            if (!data.guardadoEnSheet) {
              try {
                await agregarFilaAsheet({
                  fecha: new Date().toISOString().split("T")[0],
                  referencia: data.referencia,
                  esCliente: data.esCliente,
                  inmobiliaria: data.inmobiliaria?.inmobiliaria || null,
                  ciudad: data.inmobiliaria?.ciudad || null,
                  poliza: data.inmobiliaria?.poliza || null,
                  cantidadBoletas: data.cantidad_boletas,
                  precioTotal: data.precio_total,
                  asistentes: data.asistentes.map((a: any) => ({
                    nombre: a.nombre,
                    telefono: a.telefono,
                    correo: a.correo,
                    numDoc: a.numDoc || a.numeroDocumento || "",
                  })),
                  estado: "APROBADO",
                  ejecutivo: data.inmobiliaria?.ejecutivo || null
                });

                await doc.ref.update({ guardadoEnSheet: true });
                //console.log(`✅ Guardado en Sheets: ${referencia}`);
              } catch (sheetError) {
                console.error(`❌ Error Sheets para ${referencia}:`, sheetError);
              }
            } else {
              console.log(`⏭️ Ya guardado en Sheets: ${referencia}`);
            }

            // 3. Enviar emails (SOLO si no se han enviado)
            if (!data.emailsEnviados) {
              for (const asistente of data.asistentes) {
                try {
                  await enviarEmail({
                    correo: asistente.correo,
                    asunto: "Confirmación para el Foro Inmobiliario 2026",
                    mensaje: "Buen día. Gracias por tu compra. Adjuntamos tu confirmación de entrada al evento.",
                  });
                  //console.log(`✅ Email enviado a: ${asistente.correo}`);
                } catch (emailError) {
                  console.error(`❌ Error email a ${asistente.correo}:`, emailError);
                }
              }

              await doc.ref.update({ emailsEnviados: true });
              //console.log(`✅ Emails marcados como enviados: ${referencia}`);
            } else {
              console.log(`⏭️ Emails ya enviados: ${referencia}`);
            }

            console.log(`✅ Pago procesado completamente: ${referencia}`);
          }

          // ❌ SI ESTÁ RECHAZADO
          if (estadoGateway === "RECHAZADO") {
            await doc.ref.update({
              estado: "RECHAZADO",
              fecha_rechazo: FieldValue.serverTimestamp(),
            });
            console.log(`❌ Pago rechazado: ${referencia}`);
          }

        } catch (error: any) {
          console.error(`❌ Error verificando ${referencia}:`, error.message);
        }
      }

      console.log("✅ Verificación completada");

    } catch (error: any) {
      console.error("❌ Error general en verificación:", error);
    }
  }
);

// Función para recuperar pagos aprobados que no se guardaron en Sheets
export const recuperarPagosNoGuardadosEnSheets = onSchedule(
  {
    schedule: "every 2 hours",
    secrets: [
      GATEWAY_CREDENTIALS, 
      EMAIL_CREDENTIALS,
      FIREBASE_CONFIG_ACCOUNT
    ],
  },
  async (event) => {
    console.log("🔍 Iniciando recuperación de pagos no guardados en Sheets...");

    try {
      const snapshot = await db
        .collection("transacciones")
        .where("estado", "==", "APROBADO")
        .where("guardadoEnSheet", "==", false)
        .get();

      console.log(`📊 Transacciones aprobadas sin guardar encontradas: ${snapshot.size}`);

      if (snapshot.empty) {
        console.log("✅ No hay pagos pendientes de guardar");
        return;
      }

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const referencia = data.referencia;

        try {
          await agregarFilaAsheet({
            fecha: data.fecha_pago 
              ? new Date(data.fecha_pago.toDate()).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
            referencia: data.referencia,
            esCliente: data.esCliente,
            inmobiliaria: data.inmobiliaria?.inmobiliaria || null,
            ciudad: data.inmobiliaria?.ciudad || null,
            poliza: data.inmobiliaria?.poliza || null,
            cantidadBoletas: data.cantidad_boletas,
            precioTotal: data.precio_total,
            asistentes: data.asistentes.map((a: any) => ({
              nombre: a.nombre,
              telefono: a.telefono,
              correo: a.correo,
              numDoc: a.numDoc || a.numeroDocumento || "",
            })),
            estado: "APROBADO",
            ejecutivo: data.inmobiliaria?.ejecutivo || null
          });

          await doc.ref.update({ guardadoEnSheet: true });
          console.log(`✅ Guardado en Sheets: ${referencia}`);

        } catch (sheetError) {
          console.error(`❌ Error Sheets para ${referencia}:`, sheetError);
        }
      }

      console.log("✅ Recuperación completada");

    } catch (error: any) {
      console.error("❌ Error general en recuperación:", error);
    }
  }
);







