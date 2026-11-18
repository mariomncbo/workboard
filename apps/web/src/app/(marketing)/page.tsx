import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Logo, LogoSymbol } from "@/components/brand/Logo";
import { LandingHero } from "@/components/landing/LandingHero";
import { DOWNLOAD_URL } from "@/components/landing/landingCopy";
import styles from "@/components/landing/landing.module.css";
import { LINKS } from "@/lib/links";
import { PALETTE_COLORS, PALETTE_COLOR_NAMES, paletteVar } from "@/lib/palette";

const DESCRIPTION =
  "Organiza cada proyecto en tableros, listas y tareas. App nativa para Mac y versión web con la misma cuenta. Arrastra, colorea y deshaz con ⌘Z.";

export const metadata: Metadata = {
  title: { absolute: "WorkBoard: tableros, listas y tareas para Mac y web" },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "WorkBoard",
    title: "WorkBoard: tableros, listas y tareas para Mac y web",
    description: DESCRIPTION,
    images: [{ url: "/landing/og.jpg", width: 1200, height: 630, alt: "WorkBoard: el símbolo de puntos y un tablero con listas y tareas" }],
  },
  twitter: { card: "summary_large_image" },
};

/** A real screenshot of the app, with its frame. */
function Shot({ src, alt, width, height, className }: { src: string; alt: string; width: number; height: number; className?: string }) {
  return (
    <div className={className ? `${styles.shot} ${className}` : styles.shot}>
      <Image src={src} alt={alt} width={width} height={height} sizes="(max-width: 860px) 100vw, 620px" />
    </div>
  );
}

const FEATURES = [
  {
    title: "Tus tableros, con los favoritos primero",
    body: "Marca con una estrella los que usas cada día y búscalos por nombre aunque no escribas las tildes. Cada tablero lleva uno de los diez colores o la cuadrícula de puntos.",
    shot: { src: "/landing/inicio.png", alt: "Mi espacio de trabajo con los tableros favoritos primero y la búsqueda", height: 960 },
  },
  {
    title: "Listas blancas o negras, tareas de colores",
    body: "Cada tarea tiene nombre, descripción y, si quieres, un color. Distingue lo urgente de un vistazo sin abrir nada.",
    shot: { src: "/landing/tablero.png", alt: "Un tablero con listas blancas y negras y tareas de colores" },
    swatches: true,
  },
  {
    title: "Mueve tareas y listas arrastrándolas",
    body: "Lleva una tarea a otra lista o reordena las listas del tablero. Con el teclado también: Espacio para cogerla, flechas para moverla y Espacio para soltarla.",
    shot: { src: "/landing/arrastrar.png", alt: "Una tarea arrastrándose de una lista a otra" },
  },
  {
    title: "Deshaz cualquier cambio con ⌘Z",
    body: "¿Has borrado un tablero sin querer? Pulsa ⌘Z y vuelve con todas sus listas y tareas. Antes de borrar, WorkBoard siempre te pide confirmación.",
    shot: { src: "/landing/borrar.png", alt: "La confirmación antes de eliminar un tablero" },
  },
];

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand} aria-label="WorkBoard, inicio">
            <Logo height={28} />
          </Link>
          <nav className={styles.nav} aria-label="Secciones">
            <a className={styles.navLink} href="#funcionalidades">
              Funcionalidades
            </a>
            <a className={styles.navLink} href="#mac-y-web">
              Mac y web
            </a>
            <a className={styles.navLink} href={LINKS.repository}>
              GitHub
            </a>
          </nav>
          <Link className={`${styles.btn} ${styles.btnGlass} ${styles.btnSmall}`} href="/login">
            Iniciar sesión
          </Link>
        </div>
      </header>

      <main className={styles.content}>
        <LandingHero />
        <div className={styles.after} />

        <section id="funcionalidades" className={styles.section} aria-labelledby="features-title">
          <h2 id="features-title" className={styles.sectionTitle}>
            Todo el trabajo en un sitio, de «Por hacer» a «Hecho».
          </h2>
          <div className={styles.features}>
            {FEATURES.map((feature, index) => (
              <div key={feature.title} className={index % 2 === 1 ? `${styles.feature} ${styles.featureFlip}` : styles.feature}>
                <Shot src={feature.shot.src} alt={feature.shot.alt} width={2560} height={"height" in feature.shot && feature.shot.height ? feature.shot.height : 1440} />
                <div className={styles.featureText}>
                  <h3 className={styles.featureTitle}>{feature.title}</h3>
                  <p className={styles.featureBody}>{feature.body}</p>
                  {feature.swatches && (
                    <div className={styles.swatches} role="img" aria-label="Los diez colores de las tareas">
                      {PALETTE_COLORS.map((color) => (
                        <span key={color} title={PALETTE_COLOR_NAMES[color]} style={{ background: paletteVar(color) }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="mac-y-web" className={styles.section} aria-labelledby="platforms-title">
          <h2 id="platforms-title" className={styles.sectionTitle}>
            La misma cuenta en tu Mac y en el navegador.
          </h2>
          <p className={styles.sectionLead}>
            Tus tableros se guardan en la nube. Ábrelos desde la app de Mac o desde la web en cualquier ordenador.
          </p>
          <div className={styles.pair}>
            <div className={styles.pairItem}>
              <Shot
                src="/landing/mac.png"
                alt="La app WorkBoard en el escritorio del Mac, con un tablero de listas y tareas de colores"
                width={2000}
                height={1261}
                className={styles.pairShot}
              />
              <h3 className={styles.pairTitle}>En el Mac</h3>
              <p className={styles.featureBody}>
                Una app nativa con barra de menús, atajos de teclado y menú contextual con clic derecho, como el resto de tus apps.
              </p>
            </div>
            <div className={styles.pairItem}>
              <Shot src="/landing/web.png" alt="WorkBoard en el navegador" width={2560} height={1440} className={styles.pairShot} />
              <h3 className={styles.pairTitle}>En la web</h3>
              <p className={styles.featureBody}>
                Sin instalar nada: entra con tu correo o tu nickname y sigue donde lo dejaste. Tus últimas cuentas se abren sin volver a escribir la contraseña.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="cta-title">
          <div className={styles.closing}>
            <LogoSymbol className={styles.closingSymbol} />
            <h2 id="cta-title" className={styles.sectionTitle}>
              Crea tu primer tablero.
            </h2>
            <p className={styles.sectionLead} style={{ marginTop: 0, maxWidth: 460 }}>
              Abre una cuenta con tu correo y un nickname. Tu espacio de trabajo estará listo en un momento.
            </p>
            <div className={styles.ctas}>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} href="/registro">
                Crear una cuenta
              </Link>
              <a className={`${styles.btn} ${styles.btnGlass}`} href={DOWNLOAD_URL} download>
                Descargar para Mac
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <span className={styles.footerBrand}>
          <LogoSymbol className={styles.footerSymbol} />
          WorkBoard
        </span>
        <nav className={styles.footerNav} aria-label="Enlaces del pie">
          <a className={styles.footerLink} href={LINKS.repository}>
            Apoyar en GitHub ⭐️
          </a>
          <Link className={styles.footerLink} href="/login">
            Iniciar sesión
          </Link>
        </nav>
      </footer>
    </div>
  );
}
