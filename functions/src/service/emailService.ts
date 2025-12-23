import nodemailer from 'nodemailer';
import * as emailConfig from '../emailConfig.json';

interface datosEmail {
    correo: string;
    asunto: string;
    mensaje: string;
    pdfAdjunto?: Buffer;
    nombrePdf?: string;
}

// Configuración del transporter de nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: emailConfig.email,
        pass: emailConfig.appPassword,
    },
}); 


export async function enviarEmail(datos: datosEmail): Promise<void> {
  try {
    // 1. Enviar el correo
    await transporter.sendMail({
      from: emailConfig.email,          
      to: datos.correo,                 
      subject: datos.asunto,            
      text: datos.mensaje,              
      attachments: datos.pdfAdjunto     
        ? [
              {
                  filename: datos.nombrePdf || 'boleta.pdf',  // Usa el nombre personalizado, o 'boleta.pdf' si no hay
                  content: datos.pdfAdjunto,                   // El contenido del PDF
              },
          ]
        : [],  // Si no hay PDF, no adjuntar nada
    });
    
    // 2. Si llegó aquí, funcionó
    console.log('✅ Correo enviado a:', datos.correo);
    
  } catch (error) {
    console.error('❌ Error enviando correo:', error);
    throw error;  
  }
}