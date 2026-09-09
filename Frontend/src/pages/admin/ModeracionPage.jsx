import PlaceholderFeatureComponent from "../../components/common/PlaceholderFeatureComponent";

const ModeracionPage = () => {
  return (
    <PlaceholderFeatureComponent
      funcionalidad="Moderación"
      titulo="Moderación"
      descripcion="Herramientas y panel de control para moderación de reportes, sanciones y conductas de la comunidad."
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
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>
      }
    />
  );
};

export default ModeracionPage;
