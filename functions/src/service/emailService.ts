import nodemailer from 'nodemailer';
import { obtenerPdf } from './pdfService';
import { emailSendConfig } from '../configSecrets/emailConfig';

interface datosEmail {
  correo: string;
  asunto: string;
  mensaje: string;
}

export async function enviarEmail(datos: datosEmail): Promise<void> {
  try {

    const emailConfig = await emailSendConfig();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailConfig.email,
        pass: emailConfig.appPassword,
      },
    });

    const pdfBoleta = obtenerPdf();

    await transporter.sendMail({
      from: emailConfig.email,
      to: datos.correo,
      subject: datos.asunto,
      text: datos.mensaje,
      attachments: [
        {
          filename: 'boleta_foro_2026.pdf',
          content: pdfBoleta,
        },
      ],
    });

    console.log('✅ Correo enviado a:', datos.correo);
  } catch (error) {
    console.error('❌ Error enviando correo:', error);
    throw error;
  }
}
