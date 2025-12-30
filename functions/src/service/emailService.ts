import nodemailer from 'nodemailer';
import * as emailConfig from '../emailConfig.json';
import { obtenerPdf } from './pdfService';

interface datosEmail {
    correo: string;
    asunto: string;
    mensaje: string;
}

// Configuración del transporter de nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: emailConfig.email,
        pass: emailConfig.appPassword,
    },
}); 

const pdfBoleta = obtenerPdf();

export async function enviarEmail(datos: datosEmail): Promise<void> {
  try {
    // 1. Enviar el correo
    await transporter.sendMail({
      from: emailConfig.email,          
      to: datos.correo,                 
      subject: 'Confirmación para el Foro Inmobiliario 2026',            
      text: 'Te esperamos para vivir la mejor experiencia en Cartagena. Adjuntamos tu confirmación de entrada al evento.',              
      attachments:     
        [
          {
            filename: 'boleta_foro_2026.pdf',
            content: pdfBoleta,                   
          },
        ]
    });
    
    // 2. Si llegó aquí, funcionó
    console.log('✅ Correo enviado a:', datos.correo);
    
  } catch (error) {
    console.error('❌ Error enviando correo:', error);
    throw error;  
  }
}