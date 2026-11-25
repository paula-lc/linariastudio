// Datos del Mail Club que cambian a mano. Todo lo que el estudio tenga que actualizar está aquí.

// Plazas libres este mes. GitHub Pages no tiene servidor: este número NO baja solo con las compras,
// hay que actualizarlo a mano (o conectarlo a la plataforma de pago cuando exista).
export const PLAZAS_LIBRES = 30;
export const PLAZAS_TOTALES = 50;

// Precio de una maestra al mes, con envío e impuestos incluidos.
export const PRECIO_MES = 14;
// Descuento al elegir las dos maestras.
export const DESCUENTO_DOS = 0.12;

// Regalo: pago único. PENDIENTE de que el cliente confirme precios; de momento, meses × precio mensual.
export const REGALO_MESES = [3, 6, 12];
export const precioRegalo = (mensual, meses) => +(mensual * meses).toFixed(2);

export const MAESTRAS = {
  bruja: { nombre: 'Morna (Bruja)', corto: 'Morna' },
  driade: { nombre: 'Melisa (Dríade)', corto: 'Melisa' },
  ambas: { nombre: 'Las dos', corto: 'Morna y Melisa' },
};

export const precioMensual = plan =>
  plan === 'ambas' ? +(PRECIO_MES * 2 * (1 - DESCUENTO_DOS)).toFixed(2) : PRECIO_MES;

export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export const euros = n => n.toLocaleString('es-ES', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });

// Formulario de contacto. Vacío = modo de prueba (la postal no se envía).
// Para que llegue al correo: crear un formulario en formspree.io y pegar aquí su dirección,
// por ejemplo 'https://formspree.io/f/xxxxxxx'.
export const FORMULARIO_URL = '';

// Meses pasados: cartas que ya salieron y se pueden comprar sueltas.
// PROVISIONAL: imágenes, textos y precio de ejemplo hasta que el estudio tenga sus primeras entregas.
export const PRECIO_MES_PASADO = 14;
export const MESES_PASADOS_EJEMPLO = true;
const IMG = {
  bosque: new URL('../assets/img/ilustracion-bosque.jpg', import.meta.url).href,
  mariposas: new URL('../assets/img/ilustracion-mariposas.jpg', import.meta.url).href,
  hadas: new URL('../assets/img/ilustracion-hadas.jpg', import.meta.url).href,
  baile: new URL('../assets/img/ilustracion-baile.jpg', import.meta.url).href,
};
export const MESES_PASADOS = {
  driade: [
    { mes: 'Enero', tema: 'Infusiones para el invierno', img: IMG.bosque, texto: 'Melisa abre su herbario de invierno: tres infusiones para las noches largas y una lámina para colorear.' },
    { mes: 'Febrero', tema: 'El jardín dormido', img: IMG.mariposas, texto: 'Lo que crece bajo la escarcha y cómo despertarlo. Con semillas dibujadas para tu cartilla.' },
    { mes: 'Marzo', tema: 'Flores que hablan', img: IMG.hadas, texto: 'Un pequeño diccionario del lenguaje de las flores, escrito a mano desde la botica.' },
    { mes: 'Abril', tema: 'Lluvia de primavera', img: IMG.baile, texto: 'Remedios para días grises y una actividad para hacer mientras llueve.' },
  ],
  bruja: [
    { mes: 'Enero', tema: 'El caldero de año nuevo', img: IMG.baile, texto: 'Morna enciende el caldero y te enseña su primer hechizo del año. Incluye una receta de tinta.' },
    { mes: 'Febrero', tema: 'Hechizos de tinta', img: IMG.hadas, texto: 'Cómo se escribe una carta que nadie más puede leer, con una plantilla para practicar.' },
    { mes: 'Marzo', tema: 'Noches sin luna', img: IMG.mariposas, texto: 'Mapa de estrellas de la cabaña y lo que dice el cielo cuando la luna se esconde.' },
    { mes: 'Abril', tema: 'El gato del tejado', img: IMG.bosque, texto: 'Historia del familiar de Morna, contada por él mismo. Con pegatina de bigotes.' },
  ],
};

