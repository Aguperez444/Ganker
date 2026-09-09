import PlaceholderFeatureComponent from "../components/common/PlaceholderFeatureComponent";

const BuscarJugadoresPage = () => {
  return (
    <PlaceholderFeatureComponent
      funcionalidad="Buscar"
      titulo="Buscar jugadores"
      descripcion="Encontrá compañeros y rivales compatibles según tu nivel, rango por rol y disponibilidad horaria."
      icon={
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-10 w-10"
          aria-hidden="true"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      }
    />
  );
};

export default BuscarJugadoresPage;
