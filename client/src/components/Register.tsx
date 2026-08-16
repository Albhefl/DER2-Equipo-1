import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

/**
 * ESQUEMA DE VALIDACIÓN CON ZOD
 * Mismo patrón que Login.tsx (HU-009.1) para mantener consistencia
 * de validación en toda la app.
 */
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
    
    // 👇 ESTA ES LA PARTE QUE ACTUALIZAMOS 👇
    password: z
      .string()
      .min(1, { message: 'La contraseña es obligatoria.' })
      .min(8, { message: 'Debe tener al menos 8 caracteres.' })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]+$/, {
        message: 'La contraseña debe incluir una mayúscula, una minúscula, un número y NO debe contener símbolos.',
      }),
    // 👆 HASTA AQUÍ 👆

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

  /**
   * ENVÍO DEL FORMULARIO (Conexión Frontend - Backend)
   * Registro dual: el mismo endpoint recibe 'role' (STUDENT | EVALUATOR)
   * y el backend decide cómo persistir/diferenciar la cuenta.
   */
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
          role: data.role, // 'STUDENT' o 'EVALUATOR'
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || 'Error al registrar la cuenta. Intenta de nuevo.');
      }

      // Mostrar alerta visual de éxito
      setSuccessMessage('¡Cuenta creada exitosamente! Redirigiendo al inicio de sesión...');
      
      // Esperar 2.5 segundos y redirigir
      setTimeout(() => {
        navigate('/login');
      }, 2500);

    } catch (error: any) {
      console.error('Error en el registro:', error);
      setBackendError(error.message || 'No se pudo conectar con el servidor. Intenta más tarde.');
    }
  };

  return (
    <div className="bg-[#F6F7FB] min-h-screen flex flex-col items-center justify-center p-4 font-sans tracking-tight">

      {/* SECCIÓN IDENTIDAD VISUAL - Título e Iconos Vectoriales */}
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

        {/* ALERTA DE ERROR GENERAL (errores del backend) */}
        {backendError && !successMessage && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm p-2.5 rounded-xl text-center font-medium">
            {backendError}
          </div>
        )}

        {/* ALERTA DE ÉXITO VISUAL */}
        {successMessage && (
          <div className="mb-4 bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-sm p-3 rounded-xl text-center font-medium flex flex-col items-center gap-2 animate-pulse">
            <svg className="w-6 h-6 text-[#10B981]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

          {/* CAMPO: NOMBRE COMPLETO */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-[15px] font-regular text-[#111827]">
              Nombre completo
            </label>
            <input
              {...register('name')}
              type="text"
              id="name"
              placeholder="Ej. Ana García Pérez"
              disabled={!!successMessage}
              className={`w-full px-4 py-2.5 rounded-xl text-[#111827] placeholder-[#687280] border focus:outline-none transition-all text-[15px] ${
                errors.name
                  ? 'bg-red-50 border-2 border-red-500'
                  : 'bg-[#F6F7FB] border-[#E5E7EB] focus:border-[#94A3BB]'
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-xs font-medium pl-1">{errors.name.message}</p>
            )}
          </div>

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
              disabled={!!successMessage}
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

          {/* CAMPO: TIPO DE USUARIO / ROL */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="role" className="text-[15px] font-regular text-[#111827]">
              Tipo de usuario / Rol
            </label>
            <select
              {...register('role')}
              id="role"
              disabled={!!successMessage}
              className="w-full px-4 py-2.5 rounded-xl text-[#111827] border bg-[#F6F7FB] border-[#E5E7EB] focus:border-[#94A3BB] focus:outline-none transition-all text-[15px]"
            >
              <option value="STUDENT">Estudiante</option>
              <option value="EVALUATOR">Evaluador / Docente</option>
            </select>
            {errors.role && (
              <p className="text-red-500 text-xs font-medium pl-1">{errors.role.message}</p>
            )}
          </div>

          {/* CAMPO: CONTRASEÑA */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[15px] font-regular text-[#111827]">
              Contraseña
            </label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="••••••••••••"
                disabled={!!successMessage}
                className={`w-full px-4 py-2.5 rounded-xl text-[#111827] placeholder-[#687280] border focus:outline-none transition-all pr-12 text-[15px] ${
                  errors.password
                    ? 'bg-red-50 border-2 border-red-500'
                    : 'bg-[#F6F7FB] border-[#E5E7EB] focus:border-[#94A3BB]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={!!successMessage}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#687280] hover:text-[#111827] transition-colors disabled:opacity-50"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
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

          {/* CAMPO: CONFIRMAR CONTRASEÑA */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-[15px] font-regular text-[#111827]">
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                placeholder="••••••••••••"
                disabled={!!successMessage}
                className={`w-full px-4 py-2.5 rounded-xl text-[#111827] placeholder-[#687280] border focus:outline-none transition-all pr-12 text-[15px] ${
                  errors.confirmPassword
                    ? 'bg-red-50 border-2 border-red-500'
                    : 'bg-[#F6F7FB] border-[#E5E7EB] focus:border-[#94A3BB]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={!!successMessage}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#687280] hover:text-[#111827] transition-colors disabled:opacity-50"
                aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
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

          {/* BOTÓN DE ACCIÓN PRINCIPAL */}
          <button
            type="submit"
            disabled={isSubmitting || !!successMessage}
            className="w-full bg-[#0B1026] hover:bg-opacity-95 text-white font-semibold py-3 px-4 rounded-xl transition-all text-[16px] mt-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'Creando cuenta...' : successMessage ? 'Redirigiendo...' : 'Crear cuenta'}
          </button>

          {/* DIVISOR INTERMEDIO */}
          <div className="relative flex py-2 items-center justify-center">
            <div className="flex-grow border-t border-[#E5E7EB]"></div>
            <span className="flex-shrink mx-3 text-[13px] text-[#687280] border border-[#E5E7EB] rounded-full w-5 h-5 flex items-center justify-center bg-white">
              o
            </span>
            <div className="flex-grow border-t border-[#E5E7EB]"></div>
          </div>

          {/* REDIRECCIÓN AL LOGIN */}
          <div className="text-center text-[15px] text-[#687280]">
            ¿Ya tienes una cuenta?{' '}
            <Link
              to="/login"
              className="text-[#111827] font-semibold hover:underline ml-1"
            >
              Iniciar sesión
            </Link>
          </div>

        </form>
      </div>
    </div>
  );
};