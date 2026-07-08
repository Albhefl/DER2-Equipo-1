import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

/**
 * 1. ESQUEMA DE VALIDACIÓN CON ZOD (Criterio HU-009.1)
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'El correo electrónico es obligatorio.' })
    .email({ message: 'Formato de correo electrónico inválido.' }),
  password: z
    .string()
    .min(1, { message: 'La contraseña es obligatoria.' }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  /**
   * 2. CONFIGURACIÓN DE REACT HOOK FORM
   */
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  /**
   * 3. FUNCIÓN DE ENVÍO UNIFICADA (Conexión Frontend - Backend HU-009.2)
   */
  const onSubmit = async (data: LoginFormData) => {
    setBackendError(null); // Limpiamos errores previos al intentar conectar

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const resData = await response.json();

      // Criterio HU-009.2: Si el servidor responde con un código de error (400 o 401)
      if (!response.ok) {
        throw new Error(resData.message || 'Credenciales incorrectas. Intenta de nuevo.');
      }

      // Si las credenciales son válidas, almacena el JSON Web Token de forma segura
      localStorage.setItem('token', resData.token);
      
      // Redirección inmediata al tablero del estudiante tras el inicio de sesión exitoso
      window.location.href = '/dashboard';

    } catch (error: any) {
      // Captura el mensaje exacto del backend para pintarlo en la alerta roja de Tailwind
      setBackendError(error.message || 'No se pudo conectar con el servidor. Intenta más tarde.');
    }
  };

  return (
    <div className="bg-[#F6F7FB] min-h-screen flex flex-col items-center justify-center p-4 font-sans tracking-tight">
      
      {/* SECCIÓN IDENTIDAD VISUAL */}
      <div className="text-center mb-5">
        <h1 className="text-[40px] font-bold text-[#111827] tracking-tight mb-0.5">ClassBoard</h1>
        <div className="flex justify-center gap-4 text-[#687280] text-sm mt-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
        </div>
      </div>

      {/* TARJETA DEL FORMULARIO */}
      <div className="bg-white p-9 rounded-[20px] border border-[#E5E7EB] w-full max-w-[400px] shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
        
        {/* ALERTA DE ERROR GENERAL (Aquí caerán tus mensajes automatizados del backend) */}
        {backendError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm p-2.5 rounded-xl text-center font-medium">
            {backendError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          
          {/* CAMPO: EMAIL */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[16px] font-regular text-[#111827]">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              placeholder="floresjarumi312@gmail.com"
              className={`w-full px-4 py-2.5 rounded-xl text-black font-regular placeholder-[#687280] focus:outline-none transition-all text-[15px] ${
                errors.email 
                  ? 'bg-red-50 border-2 border-red-500' 
                  : 'bg-[#94A3BB] text-white placeholder-gray-200 border border-transparent focus:bg-[#8392AA]'
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs font-medium pl-1">{errors.email.message}</p>
            )}
          </div>

          {/* CAMPO: CONTRASEÑA */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[16px] font-regular text-[#111827]">
              Contraseña
            </label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="••••••••••••"
                className={`w-full px-4 py-2.5 rounded-xl text-[#111827] font-regular placeholder-[#687280] border focus:outline-none transition-all pr-12 text-[15px] ${
                  errors.password 
                    ? 'bg-red-50 border-2 border-red-500' 
                    : 'bg-[#F6F7FB] border-[#E5E7EB] focus:border-[#94A3BB]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#687280] hover:text-[#111827] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs font-medium pl-1">{errors.password.message}</p>
            )}
          </div>

          {/* BOTÓN DE ACCIÓN PRINCIPAL */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#0B1026] hover:bg-opacity-95 text-white font-semibold py-3 px-4 rounded-xl transition-all text-[16px] mt-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>

          {/* SOPORTE DE CUENTA */}
          <div className="text-center pt-1">
            <a href="#" className="text-[16px] font-regular text-[#111827] hover:underline">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {/* DIVISOR INTERMEDIO */}
          <div className="relative flex py-2 items-center justify-center">
            <div className="flex-grow border-t border-[#E5E7EB]"></div>
            <span className="flex-shrink mx-3 text-[13px] text-[#687280] border border-[#E5E7EB] rounded-full w-5 h-5 flex items-center justify-center bg-white">o</span>
            <div className="flex-grow border-t border-[#E5E7EB]"></div>
          </div>

          {/* REDIRECCIÓN A REGISTRO */}
          <div className="text-center text-[16px] text-[#687280]">
            ¿No tienes una cuenta?{' '}
            <a href="#" className="text-[#111827] font-semibold hover:underline ml-1">
              Registrarse
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};