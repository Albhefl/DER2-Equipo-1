import React from 'react';
import { CalendarioFuncional } from './CalendarioFuncional';

export const EstudianteCalendario: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-background">
      <CalendarioFuncional />
    </div>
  );
};

export default EstudianteCalendario;