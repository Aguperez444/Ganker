import PlaceholderFeatureComponent from "../components/common/PlaceholderFeatureComponent";

const EquiposPage = () => {
  return (
    <PlaceholderFeatureComponent
      funcionalidad="Equipos"
      titulo="Equipos"
      descripcion="Creá tu equipo, reclutá jugadores afines, gestioná el roster y participá en scrims o torneos."
      icon={
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-10 w-10"
          aria-hidden="true"
        >
          <path d="M12 2l8 4.5v6c0 5-3.5 9.5-8 11-4.5-1.5-8-6-8-11v-6L12 2z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      }
    />
  );
};

export default EquiposPage;
