import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

/**
 * 1. ESQUEMA DE VALIDACIÓN CON ZOD (Criterio HU-009.1)
 * Define las reglas estrictas que deben cumplir los campos antes de enviarse.
 * Si las reglas fallan, se intercepta el envío en el cliente sin tocar el servidor.
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'El correo electrónico es obligatorio.' }) // Valida que no esté vacío
    .email({ message: 'Formato de correo electrónico inválido.' }),  // Valida estructura de email
  password: z
    .string()
    .min(1, { message: 'La contraseña es obligatoria.' }),          // Valida que no esté vacía
});

// Extrae automáticamente el tipo de TypeScript basado en el esquema de Zod
type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  // Estado local para alternar la visibilidad de la contraseña (ojo abierto/cerrado)
  const [showPassword, setShowPassword] = useState(false);
  
  // Estado local para capturar y mostrar errores controlados provenientes de la API (HU-009.2)
  const [backendError, setBackendError] = useState<string | null>(null);

  /**
   * 2. CONFIGURACIÓN DE REACT HOOK FORM
   * Se vincula con 'zodResolver' para heredar automáticamente las validaciones del esquema.
   */
  const {
    register,         // Función para registrar los inputs y enlazar sus estados
    handleSubmit,     // Manejador que envuelve la función onSubmit y valida primero el esquema
    formState: { errors, isSubmitting }, // Extrae los errores de validación y el estado de carga
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema), // Conector oficial de Zod con los formularios de React
  });

  /**
   * 3. FUNCIÓN DE ENVÍO (Manejo de peticiones al Servidor)
   * Solo se ejecuta si Zod confirma que no hay campos vacíos ni formatos inválidos.
   */
  const onSubmit = async (data: LoginFormData) => {
    setBackendError(null); // Limpia errores previos del backend antes de intentar de nuevo
    try {
      // Petición HTTP POST hacia la API de autenticación en Node/Express
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data), // Envía las credenciales limpias en formato JSON
      });

      const resData = await response.json();

      // Si el servidor responde con un código de error (400, 401, 500, etc.)
      if (!response.ok) {
        // Criterio HU-009.2: Dispara el error genérico seguro ("Credenciales incorrectas...")
        throw new Error(resData.message || 'Credenciales incorrectas. Intenta de nuevo.');
      }

      // Si las credenciales son válidas, almacena el JSON Web Token de forma segura
      localStorage.setItem('token', resData.token);
      
      // Redirección inmediata al tablero del estudiante tras el inicio de sesión exitoso
      window.location.href = '/dashboard';
    } catch (error: any) {
      // Captura el mensaje de error para pintarlo en la alerta de la interfaz
      setBackendError(error.message);
    }
  };

  return (
    // Contenedor principal centrado con el color de fondo de la guía de estilos (#F6F7FB)
    <div className="bg-[#F6F7FB] min-h-screen flex flex-col items-center justify-center p-4 font-sans tracking-tight">
      
      {/* SECCIÓN IDENTIDAD VISUAL - Título e Iconos Vectoriales del Prototipo */}
      <div className="text-center mb-5">
        <h1 className="text-[40px] font-bold text-[#111827] tracking-tight mb-0.5">ClassBoard</h1>
        
        {/* SVGs en gris (#687280) que replican exactamente los iconos del boceto */}
        <div className="flex justify-center gap-4 text-[#687280] text-sm mt-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
        </div>
      </div>

      {/* TARJETA DEL FORMULARIO - Bordes redondeados de 20px y sombra sutil */}
      <div className="bg-white p-9 rounded-[20px] border border-[#E5E7EB] w-full max-w-[400px] shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
        
        {/* ALERTA DE ERROR GENERAL - Se muestra dinámicamente si el backend rechaza los datos */}
        {backendError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm p-2.5 rounded-xl text-center font-medium">
            {backendError}
          </div>
        )}

        {/* Formulario nativo conectado al handleSubmit de React Hook Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          
          {/* CAMPO: EMAIL */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[16px] font-regular text-[#111827]">
              Email
            </label>
            <input
              {...register('email')} // Enlace con React Hook Form
              type="email"
              id="email"
              placeholder="floresjarumi312@gmail.com"
              // Clases condicionales de Tailwind: Si hay error de Zod pinta borde rojo, si no usa el gris pizarra (#94A3BB)
              className={`w-full px-4 py-2.5 rounded-xl text-black font-regular placeholder-[#687280] focus:outline-none transition-all text-[15px] ${
                errors.email 
                  ? 'bg-red-50 border-2 border-red-500' 
                  : 'bg-[#94A3BB] text-white placeholder-gray-200 border border-transparent focus:bg-[#8392AA]'
              }`}
            />
            {/* Mensaje de error sutil debajo del input si la validación falla */}
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
                type={showPassword ? 'text' : 'password'} // Cambia dinámicamente según el estado del ojo
                id="password"
                placeholder="••••••••••••"
                // Fondo gris muy claro (#F6F7FB) acorde al prototipo analizado
                className={`w-full px-4 py-2.5 rounded-xl text-[#111827] font-regular placeholder-[#687280] border focus:outline-none transition-all pr-12 text-[15px] ${
                  errors.password 
                    ? 'bg-red-50 border-2 border-red-500' 
                    : 'bg-[#F6F7FB] border-[#E5E7EB] focus:border-[#94A3BB]'
                }`}
              />
              {/* Botón interactivo para alternar el tipo de input (ver/ocultar texto) */}
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

          {/* BOTÓN DE ACCIÓN PRINCIPAL - Color azul marino corporativo (#0B1026) */}
          <button
            type="submit"
            disabled={isSubmitting} // Se deshabilita mientras dura la petición HTTP para evitar duplicados
            className="w-full bg-[#0B1026] hover:bg-opacity-95 text-white font-semibold py-3 px-4 rounded-xl transition-all text-[16px] mt-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>

          {/* SOPORTE DE CUENTA - Recuperación de contraseña ubicada abajo del botón */}
          <div className="text-center pt-1">
            <a href="#" className="text-[16px] font-regular text-[#111827] hover:underline">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {/* DIVISOR INTERMEDIO - Línea sutil rota por un círculo con la letra "o" */}
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