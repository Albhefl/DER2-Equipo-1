import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

const resetSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
    confirmPassword: z
      .string()
      .min(1, { message: 'Por favor confirma tu contraseña.' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

type ResetFormData = z.infer<typeof resetSchema>;

export const RestablecerPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [backendError, setBackendError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetFormData) => {
    setBackendError(null);
    setSuccessMessage(null);

    if (!token) {
      setBackendError('Token de recuperación no encontrado en la URL.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: data.newPassword,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || 'No se pudo restablecer la contraseña.');
      }

      setSuccessMessage(resData.message || '¡Contraseña restablecida exitosamente!');
    } catch (error: any) {
      console.error('Error al restablecer contraseña:', error);
      setBackendError(error.message || 'Ocurrió un error al procesar tu solicitud.');
    }
  };

  if (!token) {
    return (
      <div className="bg-background-login min-h-screen flex flex-col items-center justify-center p-4 font-['Inter',sans-serif]">
        <div className="bg-white p-8 rounded-2xl border border-border w-full max-w-100 shadow-sm text-center">
          <h2 className="text-[20px] font-semibold text-[#1a1d2e] mb-2">Enlace inválido</h2>
          <p className="text-[13px] text-[#6b7280] mb-6">
            El enlace de recuperación no contiene un token válido.
          </p>
          <Link
            to="/recuperar-password"
            className="text-primary font-semibold hover:underline text-[14px]"
          >
            Solicitar un nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-login min-h-screen flex flex-col items-center justify-center p-4 font-['Inter',sans-serif] tracking-tight">
      <div className="text-center mb-6">
        <h1 className="text-[48px] font-black text-[#1a1d2e] tracking-tight mb-1">ClassBoard</h1>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-border w-full max-w-100 shadow-sm">
        <div className="text-center mb-6">
          <h2 className="text-[20px] font-semibold text-[#1a1d2e]">Restablecer contraseña</h2>
          <p className="text-[13px] text-[#6b7280] mt-1 font-normal">
            Ingresa tu nueva contraseña para acceder a tu cuenta.
          </p>
        </div>

        {backendError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-[13px] p-2.5 rounded-xl text-center font-medium">
            {backendError}
          </div>
        )}

        {successMessage ? (
          <div className="text-center">
            <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] p-3 rounded-xl font-medium flex flex-col items-center gap-2">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {successMessage}
            </div>
            <Link
              to="/login"
              className="inline-block w-full bg-[#1a1d2e] hover:bg-black text-white font-semibold py-3 px-4 rounded-xl transition-all text-[15px] mt-2 shadow-sm text-center"
            >
              Iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="newPassword" className="text-[14px] font-medium text-[#1a1d2e]">
                Nueva contraseña
              </label>
              <input
                {...register('newPassword')}
                type="password"
                id="newPassword"
                placeholder="••••••••"
                className={`w-full px-4 py-3 rounded-xl text-[#1a1d2e] border focus:outline-none transition-all text-[14px] ${
                  errors.newPassword ? 'bg-red-50 border-2 border-red-500' : 'bg-[#f4f5f8] border-border focus:border-primary'
                }`}
              />
              {errors.newPassword && (
                <p className="text-red-500 text-xs font-medium pl-1">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="text-[14px] font-medium text-[#1a1d2e]">
                Confirmar contraseña
              </label>
              <input
                {...register('confirmPassword')}
                type="password"
                id="confirmPassword"
                placeholder="••••••••"
                className={`w-full px-4 py-3 rounded-xl text-[#1a1d2e] border focus:outline-none transition-all text-[14px] ${
                  errors.confirmPassword ? 'bg-red-50 border-2 border-red-500' : 'bg-[#f4f5f8] border-border focus:border-primary'
                }`}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs font-medium pl-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1a1d2e] hover:bg-black text-white font-semibold py-3 px-4 rounded-xl transition-all text-[15px] mt-2 disabled:opacity-50 shadow-sm cursor-pointer"
            >
              {isSubmitting ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </form>
        )}

        <div className="text-center text-[13px] text-[#6b7280] mt-6">
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RestablecerPassword;
