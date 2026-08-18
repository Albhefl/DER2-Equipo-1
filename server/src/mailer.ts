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

export const enviarCorreoRecuperacion = async (destinatario: string, token: string) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetLink = `${clientUrl}/restablecer-password?token=${token}`;

  try {
    await transporter.sendMail({
      from: '"ClassBoard Support" <no-reply@classboard.com>',
      to: destinatario,
      subject: 'Restablecer contraseña - ClassBoard',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #1a1d2e; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
          <h2 style="color: #4f46e5; margin-top: 0;">Recuperación de contraseña</h2>
          <p>Hola,</p>
          <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>ClassBoard</strong>.</p>
          <p>Haz clic en el siguiente botón para crear una nueva contraseña. Este enlace expira en 15 minutos:</p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetLink}" style="background-color: #1a1d2e; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block;">Restablecer mi contraseña</a>
          </div>
          <p style="font-size: 13px; color: #6b7280;">O copia y pega el siguiente enlace en tu navegador:</p>
          <p style="font-size: 12px; color: #4f46e5; word-break: break-all;">${resetLink}</p>
          <br/>
          <hr style="border: none; border-top: 1px solid #e5e7eb;" />
          <p style="font-size: 12px; color: #9ca3af; margin-bottom: 0;">Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
        </div>
      `,
    });
    console.log(`📧 Correo de recuperación de contraseña enviado exitosamente a ${destinatario}`);
  } catch (error) {
    console.error('❌ Error al enviar el correo de recuperación:', error);
  }
};