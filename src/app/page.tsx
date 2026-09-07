import Image from "next/image";
import {
  ArrowDownRight,
  ArrowRight,
  Bath,
  Blocks,
  Check,
  ChevronRight,
  Droplets,
  Hammer,
  House,
  MessageCircle,
  PaintRoller,
  Phone,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Brand } from "@/components/Brand";
import { ContactForm } from "@/components/ContactForm";
import { Reveal } from "@/components/Reveal";

const services = [
  {
    icon: House,
    number: "01",
    title: "Reformas integrales",
    text: "Coordinación completa para viviendas, plantas, locales y zonas comunes: desmontaje, albañilería, instalaciones y acabados.",
    note: "Una obra. Un criterio.",
  },
  {
    icon: Droplets,
    number: "02",
    title: "Humedades y saneado",
    text: "Reparamos las consecuencias visibles de filtraciones ya resueltas y recuperamos techos, paredes y superficies dañadas.",
    note: "Sanear antes de tapar.",
  },
  {
    icon: Blocks,
    number: "03",
    title: "Pladur y albañilería",
    text: "Cierres, falsos techos, reparación de catas, refuerzos y redistribuciones ejecutadas según el estado real del espacio.",
    note: "Soluciones que sostienen.",
  },
  {
    icon: PaintRoller,
    number: "04",
    title: "Pintura y acabados",
    text: "Paredes, techos, puertas, madera, radiadores y remates. Preparación cuidada para que el acabado dure y se vea limpio.",
    note: "El detalle cambia el conjunto.",
  },
  {
    icon: Bath,
    number: "05",
    title: "Cocinas y baños",
    text: "Renovación parcial o completa, retirada de elementos, revestimientos, mármol y coordinación de los distintos oficios.",
    note: "Función y acabado.",
  },
  {
    icon: Wrench,
    number: "06",
    title: "Instalaciones y reparación",
    text: "Revisión y adecuación de puntos de luz, carpintería y elementos existentes dentro de una reforma bien planificada.",
    note: "Resolver, no improvisar.",
  },
];

const situations = [
  {
    icon: Hammer,
    title: "Quiero reformarlo todo",
    text: "Necesitas ordenar gremios, decisiones y tiempos en un único proyecto.",
  },
  {
    icon: Droplets,
    title: "Hay humedad o daños",
    text: "El origen está localizado y ahora toca sanear y recuperar bien el espacio.",
  },
  {
    icon: Bath,
    title: "Cocina o baño ya no funcionan",
    text: "Quieres renovar una estancia concreta sin perder el control del resto.",
  },
  {
    icon: PaintRoller,
    title: "Necesita volver a verse bien",
    text: "Paredes, techos, puertas o madera piden preparación y un acabado serio.",
  },
];

const workSteps = [
  ["01", "Escuchar y ver", "Nos cuentas qué ocurre y concertamos una visita para entender el espacio, el alcance y tus prioridades."],
  ["02", "Ordenar la obra", "Definimos qué se conserva, qué se retira, qué se repara y en qué orden conviene ejecutar cada partida."],
  ["03", "Ejecutar con control", "Coordinamos los trabajos y protegemos el entorno para avanzar con limpieza, criterio y comunicación directa."],
  ["04", "Revisar y entregar", "Comprobamos remates y funcionamiento contigo antes de dar el proyecto por terminado."],
];

const faqs = [
  ["¿Hacéis reformas completas y trabajos parciales?", "Sí. Valoramos desde una estancia o reparación concreta hasta una reforma integral con varios oficios."],
  ["¿Cómo preparáis el presupuesto?", "Primero entendemos el estado del espacio y el alcance. Cuando hace falta, realizamos una visita para evitar presupuestar a ciegas."],
  ["¿Trabajáis con viviendas ocupadas?", "Depende del tipo y la duración del trabajo. Estudiamos cómo proteger las zonas de paso y si conviene ejecutar por fases."],
  ["¿En qué zona trabajáis?", "Atendemos proyectos en Barcelona y su área metropolitana. Indica el municipio en el formulario y confirmaremos disponibilidad."],
];

function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: "Guillo Guambi",
    url: "https://guilloguambi.com",
    areaServed: ["Barcelona", "Área metropolitana de Barcelona"],
    description: "Reformas integrales, restauración, saneado, pladur, pintura, cocinas y baños.",
    sameAs: ["https://www.tiktok.com/@guilloguambi"],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export default function HomePage() {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") ?? "";
  const phoneDisplay = process.env.NEXT_PUBLIC_PHONE_DISPLAY?.trim() ?? "";
  const whatsappUrl = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent("Hola Guillo, quiero pedir una valoración para una reforma.")}`
    : "#presupuesto";

  return (
    <>
      <JsonLd />
      <header className="site-header">
        <div className="shell header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Navegación principal">
            <a href="#servicios">Servicios</a>
            <a href="#caso-real">Cómo trabajamos</a>
            <a href="#proceso">Proceso</a>
          </nav>
          <a className="button button-small" href="#presupuesto">
            Pedir valoración <ArrowRight size={16} aria-hidden />
          </a>
        </div>
      </header>

      <main>
        <section className="hero" id="inicio">
          <picture className="hero-media">
            <source srcSet="/images/hero-restauracion.avif" type="image/avif" />
            <Image src="/images/hero-restauracion.webp" alt="" fill priority sizes="100vw" />
          </picture>
          <div className="hero-shade" aria-hidden="true" />
          <div className="shell hero-grid">
            <div className="hero-copy">
              <p className="eyebrow light"><span /> Reformas y restauración · Barcelona</p>
              <h1>
                Hay espacios que no necesitan un parche.
                <em> Necesitan volver a sostenerse.</em>
              </h1>
              <p className="hero-lead">
                Reparamos lo que falla, saneamos lo que se ha deteriorado y coordinamos la
                transformación completa para que vuelvas a disfrutar del espacio.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="#presupuesto">
                  Cuéntame tu proyecto <ArrowDownRight size={19} aria-hidden />
                </a>
                <a className="button button-ghost" href="#caso-real">Ver cómo trabajo</a>
              </div>
              <ul className="hero-trust" aria-label="Compromisos de servicio">
                <li><Check size={15} /> Visita y diagnóstico</li>
                <li><Check size={15} /> Alcance explicado</li>
                <li><Check size={15} /> Trato directo</li>
              </ul>
            </div>
          </div>
          <a className="hero-scroll" href="#diagnostico" aria-label="Bajar a la siguiente sección">
            <span>Descubre</span><ArrowDownRight size={18} />
          </a>
        </section>

        <section className="proof-band" aria-label="Especialidades principales">
          <div className="shell proof-grid">
            <p>Un solo criterio para todo el proyecto</p>
            <div><strong>Refuerzo</strong><span>Estructura y soporte</span></div>
            <div><strong>Saneado</strong><span>Filtraciones y daños</span></div>
            <div><strong>Acabado</strong><span>Pladur y pintura</span></div>
          </div>
        </section>

        <section className="section section-diagnosis" id="diagnostico">
          <div className="shell">
            <Reveal>
              <div className="section-heading split-heading">
                <div>
                  <p className="eyebrow"><span /> Empieza por lo que ves</p>
                  <h2>¿Qué necesita tu espacio?</h2>
                </div>
                <p>No hace falta conocer el nombre técnico del problema. Cuéntanos qué ves y te ayudamos a ordenar el siguiente paso.</p>
              </div>
            </Reveal>
            <div className="situation-grid">
              {situations.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Reveal key={item.title} delay={index * 70}>
                    <a className="situation-card" href="#presupuesto">
                      <span className="situation-icon"><Icon size={24} /></span>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                      <span className="text-link">Hablar de esto <ChevronRight size={16} /></span>
                    </a>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section section-services" id="servicios">
          <div className="shell">
            <Reveal>
              <div className="section-heading centered">
                <p className="eyebrow"><span /> Del problema al último remate</p>
                <h2>Una reforma bien hecha empieza por entender qué hay debajo.</h2>
                <p>Actuamos sobre la causa y coordinamos las partidas necesarias, sin separar el resultado final de lo que debe sostenerlo.</p>
              </div>
            </Reveal>
            <div className="services-grid">
              {services.map((service, index) => {
                const Icon = service.icon;
                return (
                  <Reveal key={service.title} delay={(index % 3) * 70}>
                    <article className="service-card">
                      <div className="service-top">
                        <span className="service-icon"><Icon size={26} /></span>
                        <span className="service-number">{service.number}</span>
                      </div>
                      <h3>{service.title}</h3>
                      <p>{service.text}</p>
                      <span className="service-note">{service.note}</span>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className="case-study" id="caso-real">
          <div className="shell case-grid">
            <Reveal>
              <div className="case-copy">
                <p className="eyebrow light"><span /> Desde dentro de la obra</p>
                <h2>Antes de pintar de blanco, hay que saber qué merece quedarse.</h2>
                <p>
                  En un recorrido real de obra aparecen todas las decisiones importantes:
                  una viga que debe reforzar el terrado, filtraciones ya resueltas que exigen
                  saneado, catas que hay que cerrar, muebles que se conservan y otros que se retiran.
                </p>
                <blockquote>
                  “No se trata de taparlo todo. Se trata de reparar, conservar lo útil y dejar cada parte preparada para durar.”
                </blockquote>
                <a className="button button-light" href="#presupuesto">
                  Valorar mi espacio <ArrowRight size={18} />
                </a>
              </div>
            </Reveal>
            <div className="case-plan" aria-label="Lectura de una obra real">
              {[
                ["A", "Sostener", "Revisar apoyo, techo y refuerzo estructural antes de cerrar."],
                ["B", "Sanear", "Retirar lo dañado por filtraciones y preparar una base estable."],
                ["C", "Decidir", "Conservar muebles y elementos útiles; desmontar solo lo necesario."],
                ["D", "Terminar", "Coordinar pladur, puntos de luz, pintura, puertas y remates."],
              ].map(([letter, title, text]) => (
                <div className="plan-row" key={letter}>
                  <span>{letter}</span><div><strong>{title}</strong><p>{text}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section process-section" id="proceso">
          <div className="shell">
            <Reveal>
              <div className="section-heading split-heading">
                <div>
                  <p className="eyebrow"><span /> Sin saltarse pasos</p>
                  <h2>De la primera visita a la última revisión.</h2>
                </div>
                <p>Un proceso sencillo para que entiendas qué se va a hacer, por qué y qué viene después.</p>
              </div>
            </Reveal>
            <ol className="process-list">
              {workSteps.map(([number, title, text], index) => (
                <Reveal key={number} delay={index * 60}>
                  <li>
                    <span className="process-number">{number}</span>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        <section className="quote-section" id="presupuesto">
          <div className="shell quote-grid">
            <div className="quote-copy">
              <p className="eyebrow light"><span /> Hablemos de tu reforma</p>
              <h2>Cuéntame qué quieres recuperar o transformar.</h2>
              <p>Déjame los datos básicos. Revisaré tu solicitud y te contactaré para entender el trabajo antes de darte una valoración.</p>
              <div className="contact-options">
                {phoneDisplay && (
                  <a href={`tel:${phoneDisplay.replace(/\s/g, "")}`}>
                    <Phone size={20} /><span><small>Llamar</small><strong>{phoneDisplay}</strong></span>
                  </a>
                )}
                {whatsapp && (
                  <a href={whatsappUrl} target="_blank" rel="noreferrer">
                    <MessageCircle size={20} /><span><small>WhatsApp</small><strong>Escribir ahora</strong></span>
                  </a>
                )}
              </div>
              <div className="quote-promise">
                <ShieldCheck size={22} />
                <p><strong>Sin mensajes automáticos ni listas.</strong><br />Tus datos se usan únicamente para responder a esta solicitud.</p>
              </div>
            </div>
            <ContactForm />
          </div>
        </section>

        <section className="section faq-section">
          <div className="shell faq-grid">
            <div className="section-heading">
              <p className="eyebrow"><span /> Antes de empezar</p>
              <h2>Preguntas habituales.</h2>
              <p>Si tu caso es distinto, descríbelo en el formulario. Las obras se entienden mejor cuando se ven.</p>
            </div>
            <div className="faq-list">
              {faqs.map(([question, answer], index) => (
                <details key={question} open={index === 0}>
                  <summary>{question}<span>+</span></summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="shell footer-grid">
          <div><Brand inverse /><p>Reformas y restauración con criterio, trato directo y atención al detalle.</p></div>
          <div><span className="footer-label">Navegación</span><a href="#servicios">Servicios</a><a href="#proceso">Proceso</a><a href="#presupuesto">Presupuesto</a></div>
          <div><span className="footer-label">Zona de trabajo</span><p>Barcelona y área metropolitana</p><a href="https://www.tiktok.com/@guilloguambi" target="_blank" rel="noreferrer">TikTok @guilloguambi</a></div>
        </div>
        <div className="shell footer-bottom"><span>© 2026 Guillo Guambi</span><span>Trabajo real. Comunicación directa.</span></div>
      </footer>

      <a className="mobile-cta" href="#presupuesto"><Sparkles size={17} /> Pedir valoración</a>
    </>
  );
}
