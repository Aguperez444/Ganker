
import FormLogin from "../components/common/FormLogin";
export default function LoginPage() {
    return (
        <div className="flex min-h-screen flex-nowrap justify-end items-end m-0 pt-0 pb-0 pr-0 gap-4 bg-ganker-bg-light p-8 text-ganker-text m ">
            <section className="bg-ganker-border2">
                <img src="../../Public/images/logo_y_slogan_sin_fondo.png" alt="Login" className="max-w-3xs h-full"></img>
            </section>
            <main  className="m-0 pt-20 flex w-auto min-h-screen flex-col items-center justify-top gap-0 bg-ganker-input p-8 text-ganker-text">

                <section align="center" className="flex flex-row items-center justify-between pb-0 pt-0 gap-24 color-ganker-text p-8">
                    <h4 className="text-4xl font-bold border-b-2 pb-3 mb-0 border-ganker-orange">Iniciar sesión</h4>
                    <h4 className="text-4xl font-bold border-b-2 pb-3 mb-0 border-ganker-orange">Registrarse</h4>
                </section>

                <section>
                    <FormLogin />
                </section>

                <section className="min-w-3xl flex flex-row items-center justify-center gap-4 bg-ganker-input p-8 text-ganker-text">
                    <img src="../../Public/images/logo_y_slogan_sin_fondo.png" alt="Login" className="max-w-3xs h-full"></img>

                </section>
            </main>
        </div>
    );
}

