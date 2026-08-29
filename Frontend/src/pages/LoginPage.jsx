export default function LoginPage() {
    return (
        <div className="flex min-h-screen flex-nowrap justify-end items-end m-0 pt-0 pb-0 pr-0 gap-4 bg-ganker-bg-light p-8 text-ganker-text m ">
            <section className="bg-ganker-border2">
                <img src="../../Public/images/logo_y_slogan_sin_fondo.png" alt="Login" className="max-w-3xs h-full"></img>
            </section>
            <main  className="m-0 pt-20 flex min-h-screen flex-col items-center justify-top gap-4 bg-ganker-input p-8 text-ganker-text">
                <section align="center" className="flex flex-col items-center justify-center gap-4 color-ganker-text p-8">
                    <h1 className="text-4xl font-bold">Login</h1>
                    <p className="text-slate-400">
                    Inicia sesión en tu cuenta.
                    </p>
                </section>

                <section>
                    aca va el formulario de login
                </section>

                <section className="min-w-3xl flex flex-row items-center justify-center gap-4 bg-ganker-input p-8 text-ganker-text">
                    <img src="../../Public/images/logo_y_slogan_sin_fondo.png" alt="Login" className="max-w-3xs h-full"></img>

                </section>
            </main>
        </div>
    );
}

