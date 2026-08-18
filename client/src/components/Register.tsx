import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, { message: 'El nombre completo es obligatorio.' })
      .min(3, { message: 'El nombre debe tener al menos 3 caracteres.' })
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, { 
        message: 'El nombre solo puede contener letras y espacios.' 
      }),
    email: z
      .string()
      .min(1, { message: 'El correo electrónico es obligatorio.' })
      .email({ message: 'Formato de correo electrónico inválido.' }),
    role: z.enum(['STUDENT', 'EVALUATOR'], {
      error: 'Selecciona un tipo de usuario válido.',
    }),
    password: z
      .string()
      .min(1, { message: 'La contraseña es obligatoria.' })
      .min(8, { message: 'Debe tener al menos 8 caracteres.' })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]+$/, {
        message: 'Debe incluir mayúscula, minúscula, número y sin símbolos.',
      }),
    confirmPassword: z
      .string()
      .min(1, { message: 'Confirma tu contraseña.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'STUDENT',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setBackendError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim(),
          password: data.password,
          role: data.role,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || 'Error al registrar la cuenta. Intenta de nuevo.');
      }

      setSuccessMessage('¡Cuenta creada exitosamente! Redirigiendo...');
      
      setTimeout(() => {
        navigate('/login');
      }, 2500);

    } catch (error: any) {
      setBackendError(error.message || 'No se pudo conectar con el servidor. Intenta más tarde.');
    }
  };

  return (
    <div className="bg-background-login min-h-screen flex flex-col items-center justify-center p-4 font-['Inter',sans-serif] tracking-tight">

      {/* IDENTIDAD VISUAL */}
      <div className="text-center mb-6">
        <h1 className="text-[48px] font-black text-[#1a1d2e] tracking-tight mb-1">
          ClassBoard
        </h1>
        <div className="flex justify-center gap-4 text-[#6b7280] text-sm mt-1">
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
      <div className="bg-white p-8 rounded-2xl border border-border w-full max-w-100 shadow-sm">

        <div className="text-center mb-6">
          <h2 className="text-[20px] font-semibold text-[#1a1d2e]">Crear cuenta</h2>
          <p className="text-[13px] text-[#6b7280] mt-1 font-normal">
            Regístrate para comenzar en ClassBoard
          </p>
        </div>

        {backendError && !successMessage && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-[13px] p-2.5 rounded-xl text-center font-medium">
            {backendError}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] p-3 rounded-xl text-center font-medium flex flex-col items-center gap-2 animate-pulse">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-[14px] font-medium text-[#1a1d2e]">
              Nombre completo
            </label>
            <input
              {...register('name')}
              type="text"
              id="name"
              placeholder="Ej. Ana García Pérez"
              disabled={!!successMessage}
              className={`w-full px-4 py-3 rounded-xl text-[#1a1d2e] placeholder-foreground-muted border focus:outline-none transition-all text-[14px] font-normal ${
                errors.name
                  ? 'bg-red-50 border-2 border-red-500'
                  : 'bg-[#f4f5f8] border-border focus:border-primary'
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-xs font-medium pl-1">{errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[14px] font-medium text-[#1a1d2e]">
              Correo electrónico
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              placeholder="email@example.com"
              disabled={!!successMessage}
              className={`w-full px-4 py-3 rounded-xl text-[#1a1d2e] placeholder-foreground-muted border focus:outline-none transition-all text-[14px] font-normal ${
                errors.email
                  ? 'bg-red-50 border-2 border-red-500'
                  : 'bg-[#f4f5f8] border-border focus:border-primary'
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs font-medium pl-1">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="role" className="text-[14px] font-medium text-[#1a1d2e]">
              Tipo de usuario / Rol
            </label>
            <select
              {...register('role')}
              id="role"
              disabled={!!successMessage}
              className="w-full px-4 py-3 rounded-xl text-[#1a1d2e] border bg-[#f4f5f8] border-border focus:border-primary focus:outline-none transition-all text-[14px] font-normal"
            >
              <option value="STUDENT">Estudiante</option>
              <option value="EVALUATOR">Evaluador / Docente</option>
            </select>
            {errors.role && (
              <p className="text-red-500 text-xs font-medium pl-1">{errors.role.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[14px] font-medium text-[#1a1d2e]">
              Contraseña
            </label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="••••••••••••"
                disabled={!!successMessage}
                className={`w-full px-4 py-3 rounded-xl text-[#1a1d2e] placeholder-foreground-muted border focus:outline-none transition-all pr-12 text-[14px] font-normal ${
                  errors.password
                    ? 'bg-red-50 border-2 border-red-500'
                    : 'bg-[#f4f5f8] border-border focus:border-primary'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={!!successMessage}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#1a1d2e] transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs font-medium pl-1">{errors.password.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-[14px] font-medium text-[#1a1d2e]">
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                placeholder="••••••••••••"
                disabled={!!successMessage}
                className={`w-full px-4 py-3 rounded-xl text-[#1a1d2e] placeholder-foreground-muted border focus:outline-none transition-all pr-12 text-[14px] font-normal ${
                  errors.confirmPassword
                    ? 'bg-red-50 border-2 border-red-500'
                    : 'bg-[#f4f5f8] border-border focus:border-primary'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={!!successMessage}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#1a1d2e] transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs font-medium pl-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !!successMessage}
            className="w-full bg-[#1a1d2e] hover:bg-black text-white font-semibold py-3 px-4 rounded-xl transition-all text-[15px] mt-2 disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? 'Creando cuenta...' : successMessage ? 'Redirigiendo...' : 'Crear cuenta'}
          </button>

          <div className="relative flex py-2 items-center justify-center">
            <div className="grow border-t border-border"></div>
            <span className="shrink mx-3 text-[12px] text-foreground-muted border border-border rounded-full w-5 h-5 flex items-center justify-center bg-white">
              o
            </span>
            <div className="grow border-t border-border"></div>
          </div>

          <div className="text-center text-[13px] text-[#6b7280]">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline ml-1">
              Inicia sesión
            </Link>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Register;