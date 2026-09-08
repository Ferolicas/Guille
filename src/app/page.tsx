import Image from "next/image";
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  ChevronRight,
  ClipboardCheck,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { Brand } from "@/components/Brand";
import { FloatingActions, QuoteDialog } from "@/components/ContactForm";
import { PortfolioGallery } from "@/components/PortfolioGallery";
import { Reveal } from "@/components/Reveal";
import { getGalleryItems } from "@/lib/gallery";
import { generalService, services, situations } from "@/lib/service-catalog";

export const dynamic = "force-dynamic";

const workSteps = [
  ["01", "Escuchar y ver", "Nos cuentas qué ocurre y concertamos una visita para entender el espacio, el alcance y tus prioridades."],
  ["02", "Ordenar la obra", "Definimos qué se conserva, qué se retira, qué se repara y en qué orden conviene ejecutar cada partida."],
  ["03", "Ejecutar con control", "Coordinamos los trabajos y protegemos el entorno para avanzar con limpieza, criterio y comunicación directa."],
  ["04", "Revisar y entregar", "Comprobamos remates y funcionamiento contigo antes de dar el proyecto por terminado."],
];

const faqs = [
  ["¿Hacéis reformas completas y trabajos parciales?", "Sí. Valoramos desde una estancia o reparación concreta hasta una reforma integral con varios oficios."],
  ["¿Cómo preparáis el presupuesto?", "Primero entendemos el estado del espacio y el alcance. Cuando hace falta, realizamos una visita para evitar presupuestar a ciegas."],
  ["¿Qué puedo adjuntar a la solicitud?", "Puedes subir hasta tres fotos, vídeos o documentos de 200 MB cada uno. El sistema los comprime y los guarda de forma privada."],
  ["¿Trabajáis con viviendas ocupadas?", "Depende del tipo y la duración del trabajo. Estudiamos cómo proteger las zonas de paso y si conviene ejecutar por fases."],
  ["¿En qué zona trabajáis?", "Atendemos proyectos en Barcelona y su área metropolitana. Indica la población en el formulario y confirmaremos disponibilidad."],
];

function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: "Guillo Guambi",
    url: "https://guilloguambi.com",
    telephone: "+34662569563",
    areaServed: ["Barcelona", "Área metropolitana de Barcelona"],
    description: "Reformas integrales, restauración, saneado, pladur, pintura, cocinas y baños.",
    sameAs: ["https://www.tiktok.com/@guilloguambi"],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export default async function HomePage() {
  const gallery = await getGalleryItems();
  const phoneDisplay = process.env.NEXT_PUBLIC_PHONE_DISPLAY?.trim() || "662 569 563";
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") || "34662569563";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hola, quiero mas informacion")}`;

  return (
    <>
      <JsonLd />
      <header className="site-header">
        <div className="shell header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Navegación principal">
            <a href="#diagnostico">Qué necesitas</a>
            <a href="#servicios">Servicios</a>
            <a href="#caso-real">Trabajos</a>
            <a href="#proceso">Proceso</a>
          </nav>
          <a className="button button-small" href="#contacto" data-quote-service={generalService.slug}>Pedir valoración <ArrowRight size={16} aria-hidden /></a>
        </div>
      </header>

      <main>
        <section className="hero" id="inicio">
          <picture className="hero-media">
            <source srcSet="/images/hero-restauracion.avif" type="image/avif" />
            <Image src="/images/hero-restauracion.webp" alt="Profesional restaurando una pared interior" fill priority sizes="100vw" />
          </picture>
          <div className="hero-shade" aria-hidden="true" />
          <div className="shell hero-grid">
            <div className="hero-copy">
              <p className="eyebrow light hero-eyebrow"><span /> Reformas y restauración · Barcelona</p>
              <h1>Hay espacios que no necesitan un parche.<em> Necesitan volver a sostenerse.</em></h1>
              <p className="hero-lead">Reparamos lo que falla, saneamos lo que se ha deteriorado y coordinamos la transformación completa para que vuelvas a disfrutar del espacio.</p>
              <div className="hero-actions">
                <a className="button button-primary" href="#contacto" data-quote-service={generalService.slug}>Cuéntame tu proyecto <ArrowDownRight size={18} aria-hidden /></a>
                <a className="button button-ghost" href="#caso-real">Ver cómo trabajo</a>
              </div>
              <ul className="hero-trust" aria-label="Compromisos de servicio">
                <li><Check size={14} /> Visita y diagnóstico</li>
                <li><Check size={14} /> Alcance explicado</li>
                <li><Check size={14} /> Trato directo</li>
              </ul>
            </div>
          </div>
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
            <Reveal><div className="section-heading split-heading"><div><p className="eyebrow"><span /> Empieza por lo que ves</p><h2>¿Qué necesita tu espacio?</h2></div><p>No hace falta conocer el nombre técnico del problema. Elige lo que más se parece a tu caso y abriremos una valoración ya contextualizada.</p></div></Reveal>
            <div className="situation-grid">
              {situations.map((item, index) => <Reveal key={item.slug} delay={index * 60}><a className="situation-card" href="#contacto" data-quote-service={item.slug}><div className="card-image"><Image src={item.image} alt={item.imageAlt} fill sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 25vw" /></div><div className="situation-copy"><span className="card-index">0{index + 1}</span><h3>{item.title}</h3><p>{item.summary}</p><span className="text-link">Valorar este caso <ChevronRight size={16} /></span></div></a></Reveal>)}
            </div>
          </div>
        </section>

        <section className="section section-services" id="servicios">
          <div className="shell">
            <Reveal><div className="section-heading centered"><p className="eyebrow"><span /> Del problema al último remate</p><h2>Una reforma bien hecha empieza por entender qué hay debajo.</h2><p>Cada servicio se valora con su propio alcance. Abre la tarjeta adecuada y el formulario ya sabrá qué necesitas.</p></div></Reveal>
            <div className="services-grid">
              {services.map((service, index) => <Reveal key={service.slug} delay={(index % 3) * 60}><a className="service-card" href="#contacto" data-quote-service={service.slug}><div className="service-image"><Image src={service.image} alt={service.imageAlt} fill sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 33vw" /></div><div className="service-card-copy"><div className="service-top"><span className="service-number">{String(index + 1).padStart(2, "0")}</span><ArrowDownRight size={18} /></div><h3>{service.title}</h3><p>{service.summary}</p><span className="service-note">{service.note}</span></div></a></Reveal>)}
            </div>
          </div>
        </section>

        <section className="portfolio-section" id="caso-real">
          <div className="shell">
            <Reveal><div className="portfolio-heading"><div><p className="eyebrow light"><span /> Ver cómo trabajo</p><h2>Antes, después<br />y todo lo que cambia en medio.</h2></div><p>Esta galería queda preparada para tus trabajos reales. Cuando subas una o dos piezas desde el panel, la tarjeta alternará automáticamente y también permitirá elegir Antes o Después.</p></div></Reveal>
            <PortfolioGallery items={gallery} />
          </div>
        </section>

        <section className="section process-section" id="proceso">
          <div className="shell">
            <Reveal><div className="section-heading split-heading"><div><p className="eyebrow"><span /> Sin saltarse pasos</p><h2>De la primera visita a la última revisión.</h2></div><p>Un proceso sencillo para que entiendas qué se va a hacer, por qué y qué viene después.</p></div></Reveal>
            <ol className="process-list">{workSteps.map(([number, title, text], index) => <Reveal key={number} delay={index * 60}><li><span className="process-number">{number}</span><h3>{title}</h3><p>{text}</p></li></Reveal>)}</ol>
          </div>
        </section>

        <section className="contact-section" id="contacto">
          <div className="shell contact-grid">
            <div className="contact-copy"><p className="eyebrow light"><span /> Una conversación útil</p><h2>Elige cómo quieres empezar.</h2><p>El formulario sirve para enviar un caso completo. Si solo quieres resolver una duda, también puedes llamar o escribir directamente.</p></div>
            <div className="contact-methods">
              <a href="#contacto" data-quote-service={generalService.slug}><ClipboardCheck size={22} /><div><span>Valoración con archivos</span><strong>Contar mi proyecto</strong><small>Dos pasos · fotos y vídeos opcionales</small></div><ArrowRight size={18} /></a>
              <a href={`tel:+34${phoneDisplay.replace(/\D/g, "")}`}><Phone size={22} /><div><span>Llamar directamente</span><strong>{phoneDisplay}</strong><small>Barcelona y área metropolitana</small></div><ArrowRight size={18} /></a>
              <a href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={22} /><div><span>WhatsApp</span><strong>Escribir ahora</strong><small>Mensaje preparado para empezar</small></div><ArrowRight size={18} /></a>
            </div>
            <div className="contact-privacy"><ShieldCheck size={19} /><p><strong>Tus archivos son privados.</strong> Se comprimen, se guardan fuera de la web pública y solo Guillo puede abrirlos desde el panel.</p></div>
          </div>
        </section>

        <section className="section faq-section">
          <div className="shell faq-grid"><div className="section-heading"><p className="eyebrow"><span /> Antes de empezar</p><h2>Preguntas habituales.</h2><p>La información importante está aquí. Para un caso concreto, usa la tarjeta que mejor describa tu espacio.</p></div><div className="faq-list">{faqs.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="shell footer-grid"><div><Brand inverse /><p>Reformas y restauración con criterio, trato directo y atención al detalle.</p></div><div><span className="footer-label">Explorar</span><a href="#diagnostico">Qué necesitas</a><a href="#servicios">Servicios</a><a href="#caso-real">Trabajos</a><a href="#proceso">Proceso</a></div><div><span className="footer-label">Contacto</span><a href={`tel:+34${phoneDisplay.replace(/\D/g, "")}`}>{phoneDisplay}</a><a href={whatsappUrl} target="_blank" rel="noreferrer">WhatsApp</a><a href="https://www.tiktok.com/@guilloguambi" target="_blank" rel="noreferrer">TikTok @guilloguambi</a><a href="/panel" className="panel-footer-link">Panel privado</a></div></div>
        <div className="shell footer-bottom"><span>© 2026 Guillo Guambi</span><span>Trabajo real. Comunicación directa.</span></div>
      </footer>

      <FloatingActions />
      <QuoteDialog />
    </>
  );
}
