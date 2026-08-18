import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api'; 

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
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setBackendError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
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

      if (!response.ok) {
        throw new Error(resData.message || 'Credenciales incorrectas. Intenta de nuevo.');
      }

      localStorage.setItem('token', resData.token);
      const userData = resData.user || { role: resData.role };
      localStorage.setItem('user', JSON.stringify(userData));

      const userRole = String(userData.role || "").toLowerCase().trim();

      if (userRole === 'student') {
        navigate('/estudiante-dashboard');
      } else if (userRole === 'evaluator') {
        navigate('/evaluador-evaluaciones');
      } else {
        throw new Error(`El usuario tiene el rol '${userRole}', el cual no es válido.`);
      }
    } catch (error: any) {
      setBackendError(error.message || 'No se pudo conectar con el servidor. Intenta más tarde.');
    }
  };

  return (
    <div className="bg-background-login min-h-screen flex flex-col items-center justify-center p-4 font-['Inter',sans-serif] tracking-tight">

      {/* SECCIÓN IDENTIDAD VISUAL CON LOS 3 ICONOS EXACTOS DE FIGMA */}
      <div className="text-center mb-5">
        <h1 className="text-[48px] font-black text-[#1a1d2e] tracking-tight mb-1">ClassBoard</h1>

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
      <div className="bg-white p-9 rounded-[20px] border border-border w-full max-w-100 shadow-sm">

        {backendError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm p-2.5 rounded-xl text-center font-medium">
            {backendError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

          {/* CAMPO: EMAIL (Color #94A3BB como se observa en Figma) */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[15px] font-medium text-[#1a1d2e]">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              placeholder="email@example.com"
              className={`w-full px-4 py-2.5 rounded-xl text-white font-normal placeholder-gray-200 focus:outline-none transition-all text-[15px] ${
                errors.email
                  ? 'bg-red-50 border-2 border-red-500 text-[#1a1d2e]'
                  : 'bg-[#94A3BB] border border-transparent focus:bg-[#8392AA]'
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs font-medium pl-1">{errors.email.message}</p>
            )}
          </div>

          {/* CAMPO: CONTRASEÑA */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[15px] font-medium text-[#1a1d2e]">
              Contraseña
            </label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="••••••••••••"
                className={`w-full px-4 py-2.5 rounded-xl text-[#1a1d2e] font-normal placeholder-[#6b7280] border focus:outline-none transition-all pr-12 text-[15px] ${
                  errors.password
                    ? 'bg-red-50 border-2 border-red-500'
                    : 'bg-[#f4f5f8] border-border focus:border-primary'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#1a1d2e] transition-colors"
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

          {/* BOTÓN DE ACCIÓN PRINCIPAL */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#1a1d2e] hover:bg-black text-white font-semibold py-3 px-4 rounded-xl transition-all text-[16px] mt-2 disabled:opacity-50 shadow-sm cursor-pointer"
          >
            {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>

          {/* ¿OLVIDASTE TU CONTRASEÑA? */}
          <div className="text-center pt-1">
            <Link to="/recuperar-password" className="text-[14px] font-normal text-[#1a1d2e] hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* DIVISOR INTERMEDIO CON LA 'o' EN CÍRCULO */}
          <div className="relative flex py-2 items-center justify-center">
            <div className="grow border-t border-border"></div>
            <span className="shrink mx-3 text-[13px] text-[#6b7280] border border-border rounded-full w-5 h-5 flex items-center justify-center bg-white">
              o
            </span>
            <div className="grow border-t border-border"></div>
          </div>

          {/* REDIRECCIÓN A REGISTRO */}
          <div className="text-center text-[14px] text-[#6b7280]">
            ¿No tienes una cuenta?{' '}
            <Link to="/register" className="text-[#1a1d2e] font-semibold hover:underline ml-1">
              Registrarse
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;