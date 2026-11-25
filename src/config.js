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
