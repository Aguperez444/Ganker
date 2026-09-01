
import FormLogin from "../components/common/FormLogin";
import { Link } from "react-router-dom";
export default function LoginPage() {
    const handleSubmitTrigger = () => {
        const form = document.querySelector('form');
        if (form) {
            form.requestSubmit();
        }
    };

    return (
        <div className="flex pe-0 pt-0 pb-0 min-h-screen w-full items-center justify-around gap-4 bg-ganker-input p-8 box-border h-full">

            <section className="flex flex-2 flex-col items-center justify-center space-y-50">
                <img
                    src="../../Public/images/Logo_y_letras_blanco_con_subtitulo_y_juegos_blanco.svg"
                    alt="Logo"
                    className="h-auto w-200 pt-20"
                />
                <Link to="/register" className=" text-center px-4 py-3 mt-0 mb-0 pt-2 pb-3 rounded-lg text-ganker-text opacity-70 hover:text-ganker-orange hover:rounded-lg hover:border hover:pr-40 hover:pl-40 absolute bottom-13.5 text-2xl font-body hover:opacity-100 transition-all duration-300">
                    Registrarse
                </Link>
            </section>

            <main className="m-0 pt-20 flex flex-1 w-auto min-h-screen flex-col items-center justify-top justify-around gap-0 bg-ganker-card2 p-8 text-ganker-text ">
                <section className="min-w-3xl flex flex-col items-center justify-center gap-4  bg-ganker-card2 p-8 text-ganker-text">
                    <img src="../../Public/images/Ganker_sin_fondo.png" alt="Login" className="max-w-3xs h-full"></img>
                </section>

                <section className="min-w-3xl flex flex-col items-center justify-center gap-4  bg-ganker-card2 p-8 text-ganker-text">
                    <FormLogin />

                    <img src="../../Public/images/banner_sin_fondo.png" alt="Login" className="max-w-3xs h-full pt-9"></img>            
                </section>

                <section className="min-w-3xl flex flex-col items-center justify-end gap-4  bg-ganker-card2 p-8 text-ganker-text">
        
                    <button
                        type="button"
                        onClick={handleSubmitTrigger}
                        className="w-lg mt-0 mb-0 pt-2 pb-3 rounded-lg border border-ganker-orange hover:bg-gradient-to-r hover:transition-shadow hover:shadow-ganker-orange hover:shadow-[0_-0px_10px] hover:text-ganker-text from-ganker-orange via-ganker-orange via-30% to-ganker-purple px-4 py-3 font-semibold text-ganker-text transition hover:opacity-90 text-2xl "
                    >
                        Iniciar sesión
                    </button>
                    
                    
                

                </section>
            </main>
        </div>
    );
}

