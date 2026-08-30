import { useForm } from 'react-hook-form';

export default function FormLogin() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    console.log('Datos de login:', data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-lg h-max   bg-ganker-card2 p-6 text-ganker-text shadow-lg">

      <div className="space-y-10">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-ganker-text">Email</label>
          <input id="email" type="email" placeholder="correo@ejemplo.com" className="w-full rounded-lg border border-ganker-border2 bg-ganker-input px-3 py-2 text-ganker-text placeholder:text-ganker-text/70 focus:outline-none focus:ring-2 focus:ring-ganker-border2"
            {...register('email', {
              required: 'El email es obligatorio',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Debe ingresar un email válido',
              },
            })}/>
          {errors.email && <span className="text-xs text-ganker-input">{errors.email.message}</span>}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium text-ganker-text"> Contraseña </label>

          <input id="password" type="password" placeholder="********"className="w-full rounded-lg border border-ganker-border2 bg-ganker-input px-3 py-2 text-ganker-text placeholder:text-ganker-text/70 focus:outline-none focus:ring-2 focus:ring-ganker-border2"
            {...register('password', {
              required: 'La contraseña es obligatoria',
              minLength: {value: 6, message: 'La contraseña debe tener al menos 6 caracteres',},})}/>
          {errors.password && <span className="text-xs text-ganker-text">{errors.password.message}</span>}

        </div>


        <div className="flex items-center justify-between text-xs text-ganker-text/80">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="h-3.5 w-3.5 accent-ganker-" />
            Recordarme
          </label>
          <a href="#" className="text-ganker-text hover:opacity-80 ">
            ¿Olvidaste tu contraseña?
          </a>
        </div>
        
      </div>
    </form>
  );
}


