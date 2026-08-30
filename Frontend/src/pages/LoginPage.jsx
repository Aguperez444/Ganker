
import FormLogin from "../components/common/FormLogin";

export default function LoginPage() {
    const handleSubmitTrigger = () => {
        const form = document.querySelector('form');
        if (form) {
            form.requestSubmit();
        }
    };

    return (
        <div className="flex pe-0 pt-0 pb-0 min-h-screen w-full items-center justify-between gap-4 bg-ganker-input p-8 box-border w-full h-full">
            <section className="flex h-full items-center justify-center">
                <img
                    src="../../Public/images/logo_blanco_v2.png"
                    alt="Logo"
                    className="h-auto w-[800px] max-w-full object-contain"
                />
            </section>
            <main className="m-0 pt-20 flex w-auto min-h-screen flex-col items-center justify-top justify-around gap-0 bg-ganker-card2 p-8 text-ganker-text ">
                <section className="min-w-3xl flex flex-col items-center justify-center gap-4  bg-ganker-card2 p-8 text-ganker-text">
                    <img src="../../Public/images/Ganker_sin_fondo.png" alt="Login" className="max-w-3xs h-full"></img>
                </section>

                <section align="center" className="flex flex-col items-center  color-ganker-text p-8 border border-ganker-border2 shadow-[0_-4px_28px] shadow-ganker-sombra">
                    <FormLogin />

                    <img src="../../Public/images/banner_sin_fondo.png" alt="Login" className="max-w-3xs h-full pt-9"></img>            
                </section>

                <section className="min-w-3xl flex flex-col items-center justify-center gap-4  bg-ganker-card2 p-8 text-ganker-text">
        
                    <button
                        type="button"
                        onClick={handleSubmitTrigger}
                        className="mt-0 mb-0 w-full rounded-lg border border-ganker-orange bg-gradient-to-r from-ganker-orange via-ganker-orange via-30% to-ganker-purple px-4 py-3 text-sm font-semibold text-ganker-text transition hover:opacity-90"
                    >
                        Iniciar sesión
                    </button>
                    

                </section>
            </main>
        </div>
    );
}

