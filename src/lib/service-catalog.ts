export type ServiceCatalogItem = {
  slug: string;
  title: string;
  summary: string;
  includes: string;
  image: string;
  imageAlt: string;
  note: string;
};

export const situations: ServiceCatalogItem[] = [
  {
    slug: "reforma-completa",
    title: "Quiero reformarlo todo",
    summary: "Necesitas ordenar gremios, decisiones y tiempos en un único proyecto.",
    includes: "Valoramos el estado general, las prioridades y las partidas necesarias para ordenar una reforma integral con un único criterio.",
    image: "/images/cards/situation-reforma.webp",
    imageAlt: "Vivienda protegida y preparada para planificar una reforma integral",
    note: "Empezar con una visión completa",
  },
  {
    slug: "humedad-danos",
    title: "Hay humedad o daños",
    summary: "El origen está localizado y ahora toca sanear y recuperar bien el espacio.",
    includes: "Revisamos el daño visible, el soporte afectado y la preparación necesaria después de resolver el origen de la humedad.",
    image: "/images/cards/situation-humedad.webp",
    imageAlt: "Pared afectada por humedad durante una inspección profesional",
    note: "Sanear antes de cerrar",
  },
  {
    slug: "cocina-bano",
    title: "Cocina o baño ya no funcionan",
    summary: "Quieres renovar una estancia concreta sin perder el control del resto.",
    includes: "Estudiamos distribución, revestimientos, mobiliario e instalaciones para definir una renovación parcial o completa.",
    image: "/images/cards/situation-cocina-bano.webp",
    imageAlt: "Cocina y baño de una vivienda antes de su renovación",
    note: "Recuperar función y comodidad",
  },
  {
    slug: "renovar-acabados",
    title: "Necesita volver a verse bien",
    summary: "Paredes, techos, puertas o madera piden preparación y un acabado serio.",
    includes: "Comprobamos soportes, reparaciones previas y acabados para que pintura, madera y remates queden uniformes y duraderos.",
    image: "/images/cards/situation-acabados.webp",
    imageAlt: "Pared y puerta preparadas cuidadosamente antes de pintar",
    note: "Preparar bien para terminar mejor",
  },
];

export const services: ServiceCatalogItem[] = [
  {
    slug: "reformas-integrales",
    title: "Reformas integrales",
    summary: "Coordinación completa para viviendas, plantas, locales y zonas comunes.",
    includes: "Incluye el estudio del conjunto, desmontaje, albañilería, coordinación de instalaciones y acabados según el alcance acordado.",
    image: "/images/cards/service-reforma-integral.webp",
    imageAlt: "Piso de Barcelona durante una reforma integral organizada",
    note: "Una obra. Un criterio.",
  },
  {
    slug: "humedades-saneado",
    title: "Humedades y saneado",
    summary: "Recuperación de techos, paredes y superficies después de resolver la filtración.",
    includes: "Incluye la retirada de material dañado, secado, consolidación del soporte y preparación de la superficie para reconstruir y acabar.",
    image: "/images/cards/service-humedades.webp",
    imageAlt: "Muro saneado y equipos de secado en una vivienda",
    note: "Sanear antes de tapar.",
  },
  {
    slug: "pladur-albanileria",
    title: "Pladur y albañilería",
    summary: "Cierres, falsos techos, reparación de catas, refuerzos y redistribuciones.",
    includes: "Incluye la revisión del soporte, replanteo, perfilería o fábrica, cerramientos y preparación para el acabado final.",
    image: "/images/cards/service-pladur.webp",
    imageAlt: "Perfilería y placas de yeso durante una redistribución interior",
    note: "Soluciones que sostienen.",
  },
  {
    slug: "pintura-acabados",
    title: "Pintura y acabados",
    summary: "Paredes, techos, puertas, madera, radiadores y remates cuidados.",
    includes: "Incluye protección, reparación y preparación de superficies, aplicación del acabado adecuado y revisión de encuentros y remates.",
    image: "/images/cards/service-pintura.webp",
    imageAlt: "Estancia protegida durante un trabajo de pintura interior",
    note: "El detalle cambia el conjunto.",
  },
  {
    slug: "cocinas-banos",
    title: "Cocinas y baños",
    summary: "Renovación parcial o completa y coordinación de los distintos oficios.",
    includes: "Incluye valoración de retirada, revestimientos, mobiliario, encimeras e instalaciones necesarias para recuperar uso y comodidad.",
    image: "/images/cards/service-cocinas-banos.webp",
    imageAlt: "Cocina en proceso de colocación de revestimientos y encimera",
    note: "Función y acabado.",
  },
  {
    slug: "instalaciones-reparacion",
    title: "Instalaciones y reparación",
    summary: "Puntos de luz, carpintería y elementos existentes dentro de la reforma.",
    includes: "Incluye la revisión de los elementos afectados, definición de las reparaciones y coordinación con el resto de partidas de la obra.",
    image: "/images/cards/service-instalaciones.webp",
    imageAlt: "Elementos eléctricos y de carpintería preparados para su instalación",
    note: "Resolver, no improvisar.",
  },
];

export const generalService: ServiceCatalogItem = {
  slug: "valoracion-general",
  title: "Valoración general",
  summary: "Cuéntanos qué ocurre aunque todavía no sepas qué servicio necesitas.",
  includes: "Revisaremos tus datos y el material que envíes para entender el punto de partida y proponerte el siguiente paso adecuado.",
  image: "/images/cards/situation-reforma.webp",
  imageAlt: "Planificación de una reforma",
  note: "Primero entendemos el espacio.",
};

export const allCatalogItems = [...situations, ...services, generalService];

export function findService(slug: string | null | undefined) {
  return allCatalogItems.find((item) => item.slug === slug) ?? generalService;
}
