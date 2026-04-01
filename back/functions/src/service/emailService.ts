import nodemailer from "nodemailer";
import type { SendMailOptions } from "nodemailer";
import { obtenerPdf } from "./pdfService";
import { emailSendConfig } from "../configSecrets/emailConfig";

interface datosEmail {
  correo: string;
  asunto: string;
  mensaje: string;
  /**
   * Solo las compras de boletas adjuntan el PDF. Reservas de charla u otros envíos van sin adjunto.
   * Por defecto false.
   */
  adjuntarBoletaPdf?: boolean;
}

export async function enviarEmail(datos: datosEmail): Promise<void> {
  try {
    const emailConfig = await emailSendConfig();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailConfig.email,
        pass: emailConfig.appPassword,
      },
    });

    const mailOptions: SendMailOptions = {
      from: emailConfig.email,
      to: datos.correo,
      subject: datos.asunto,
      text: datos.mensaje,
    };

    if (datos.adjuntarBoletaPdf === true) {
      const pdfBoleta = obtenerPdf();
      mailOptions.attachments = [
        {
          filename: "boleta_foro_2026.pdf",
          content: pdfBoleta,
        },
      ];
    }

    await transporter.sendMail(mailOptions);

    console.log("✅ Correo enviado a:", datos.correo);
  } catch (error) {
    console.error("❌ Error enviando correo:", error);
    throw error;
  }
}
