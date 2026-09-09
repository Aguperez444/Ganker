import PlaceholderFeatureComponent from "../../components/common/PlaceholderFeatureComponent";

const CharactersPage = () => {
  return (
    <PlaceholderFeatureComponent
      funcionalidad="Personajes"
      titulo="Personajes"
      descripcion="Administración del catálogo de personajes, agentes, héroes y campeones asociados a cada juego."
      badge="Administración"
      volverRuta="/app/admin"
      volverTexto="Volver a administración"
      icon={
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-10 w-10"
          aria-hidden="true"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      }
    />
  );
};

export default CharactersPage;
