/**
 * Pantalla inicial. Sirve como verificacion rapida de que el entorno
 * quedo bien configurado (React + Tailwind + variables de entorno).
 * Se puede reemplazar por completo cuando arranquen las features reales.
 */
import FondoApp from "../components/common/FondoApp.jsx";
import Header from "../components/common/Header.jsx";
import Footer from "../components/common/Footer.jsx";
function HomePage() {
  const apiUrl = import.meta.env.VITE_API_URL;

  return (
    <main className="flex min-h-screen flex-col" stroke="currentColor">
      <Header />
      <div className="flex flex-1 flex-col">
        <FondoApp />
      </div>
      <Footer />
    </main>
  );

}

export default HomePage;
