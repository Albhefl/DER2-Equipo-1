import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

/**
 * ESQUEMA DE VALIDACIÓN
 */
const recoverSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'El correo electrónico es obligatorio.' })
    .email({ message: 'Formato de correo electrónico inválido.' }),
});

type RecoverFormData = z.infer<typeof recoverSchema>;

export const RecuperarPassword: React.FC = () => {
  const [backendError, setBackendError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecoverFormData>({
    resolver: zodResolver(recoverSchema),
  });

  const onSubmit = async (data: RecoverFormData) => {
    setBackendError(null);
    setSuccessMessage(null);

    try {
      // NOTA: Asegúrate de que este endpoint exista en tu backend de Node/Express
      const response = await fetch(`${API_BASE_URL}/auth/recover-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email.trim(),
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || 'No se pudo procesar la solicitud. Verifica tu correo.');
      }

      setSuccessMessage('Si el correo está registrado, te hemos enviado un enlace para restablecer tu contraseña.');
    } catch (error: any) {
      console.error('Error en recuperación:', error);
      setBackendError(error.message || 'No se pudo conectar con el servidor. Intenta más tarde.');
    }
  };

  return (
    <div className="bg-[#F6F7FB] min-h-screen flex flex-col items-center justify-center p-4 font-sans tracking-tight">
      
      {/* SECCIÓN IDENTIDAD VISUAL */}
      <div className="text-center mb-5">
        <h1 className="text-[40px] font-bold text-[#111827] tracking-tight mb-0.5">ClassBoard</h1>
        <div className="flex justify-center gap-4 text-[#687280] text-sm mt-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
      </div>

      {/* TARJETA DEL FORMULARIO */}
      <div className="bg-white p-9 rounded-[20px] border border-[#E5E7EB] w-full max-w-[400px] shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
        
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-[#111827]">Recuperar contraseña</h2>
          <p className="text-[14px] text-[#687280] mt-2">
            Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
          </p>
        </div>

        {/* ALERTA DE ERROR GENERAL */}
        {backendError && !successMessage && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm p-2.5 rounded-xl text-center font-medium">
            {backendError}
          </div>
        )}

        {/* ALERTA DE ÉXITO VISUAL */}
        {successMessage && (
          <div className="mb-4 bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-sm p-3 rounded-xl text-center font-medium flex flex-col items-center gap-2">
            <svg className="w-6 h-6 text-[#10B981]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {successMessage}
          </div>
        )}

        {!successMessage ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            
            {/* CAMPO: EMAIL */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[15px] font-regular text-[#111827]">
                Correo electrónico
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                placeholder="email@example.com"
                className={`w-full px-4 py-2.5 rounded-xl text-[#111827] placeholder-[#687280] border focus:outline-none transition-all text-[15px] ${
                  errors.email
                    ? 'bg-red-50 border-2 border-red-500'
                    : 'bg-[#F6F7FB] border-[#E5E7EB] focus:border-[#94A3BB]'
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs font-medium pl-1">{errors.email.message}</p>
              )}
            </div>

            {/* BOTÓN DE ENVIAR */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0B1026] hover:bg-opacity-95 text-white font-semibold py-3 px-4 rounded-xl transition-all text-[16px] mt-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
        ) : null}

        {/* REDIRECCIÓN AL LOGIN */}
        <div className="text-center text-[15px] text-[#687280] mt-6">
          <Link
            to="/login"
            className="text-[#111827] font-semibold hover:underline flex items-center justify-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a iniciar sesión
          </Link>
        </div>

      </div>
    </div>
  );
};