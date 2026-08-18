import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const enviarCorreoInvitacion = async (destinatario: string, nombreProyecto: string, rol: 'estudiante' | 'evaluador') => {
  const rolTexto = rol === 'evaluador' ? 'evaluador' : 'estudiante colaborador';
  
  try {
    await transporter.sendMail({
      from: '"ClassBoard Platform" <no-reply@classboard.com>',
      to: destinatario,
      subject: `Invitación al proyecto: ${nombreProyecto}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1a1d2e; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #4f46e5; margin-top: 0;">¡Has sido invitado a ClassBoard!</h2>
          <p>Hola,</p>
          <p>Has sido agregado como <strong>${rolTexto}</strong> en el proyecto <strong>${nombreProyecto}</strong>.</p>
          <p>Inicia sesión en la plataforma para ver los detalles, tareas asignadas y fechas límites.</p>
          <br/>
          <hr style="border: none; border-top: 1px solid #e5e7eb;" />
          <p style="font-size: 12px; color: #6b7280; margin-bottom: 0;">Este es un mensaje automático de la plataforma ClassBoard. Por favor no respondas a este correo.</p>
        </div>
      `,
    });
    console.log(`📧 Correo de invitación enviado exitosamente a ${destinatario} (${rol})`);
  } catch (error) {
    console.error('❌ Error al enviar el correo de invitación:', error);
  }
};