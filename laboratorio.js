'use strict';

const plantillas = {
  primaria: {
    objetivo: 'Diseña una actividad para enseñar fracciones equivalentes a mi grupo de primaria.',
    contexto: 'El grupo cursa cuarto grado. Tengo 40 minutos, hojas y lápices de colores.',
    formato: 'pasos',
    rol: 'Asesor de didáctica para primaria.',
    criterios: 'Incluye un ejemplo visual, práctica en parejas y una pregunta de cierre.',
    aclarar: true,
  },
  secundaria: {
    objetivo: 'Ayúdame a estudiar ecuaciones de primer grado para mi examen.',
    contexto: 'Estoy en secundaria. Puedo estudiar 30 minutos al día durante tres días.',
    formato: 'tabla',
    limites: 'Dame pistas y deja que intente resolver los ejercicios antes de mostrar las soluciones.',
    criterios: 'Incluye una práctica corta por día y explica cómo puedo revisar mi avance.',
  },
  universidad: {
    objetivo: 'Ayúdame a delimitar una pregunta de investigación para un ensayo sobre el desperdicio de alimentos.',
    contexto: 'Es para una materia universitaria. El ensayo tendrá 1,500 palabras y usaré fuentes académicas.',
    formato: 'guia',
    limites: 'Evita inventar referencias. Sugiere palabras clave para buscar fuentes verificables.',
    criterios: 'Propón tres preguntas acotadas e indica qué evidencia necesitaría para responder cada una.',
  },
  hogar: {
    objetivo: 'Planea las cenas para cuatro personas durante cinco días y arma una lista de compras.',
    contexto: 'Ya tengo arroz, frijoles y huevos. Puedo dedicar hasta 30 minutos a cocinar cada día.',
    formato: 'guia',
    criterios: 'Reutiliza ingredientes, separa los que ya tengo de los que debo comprar e indica cantidades aproximadas.',
    aclarar: true,
  },
  taxi: {
    objetivo: 'Crea un registro diario para saber cuánto me queda después de los gastos del taxi.',
    contexto: 'Quiero llenarlo desde el celular al terminar cada turno. Manejo cantidades en pesos mexicanos.',
    formato: 'tabla',
    limites: 'Usa cifras ficticias y deja fuera los datos de pasajeros.',
    criterios: 'Incluye ingresos, gasolina, otros gastos y la fórmula para calcular el total neto.',
  },
  comida: {
    objetivo: 'Prepara un anuncio para WhatsApp de una promoción de hamburguesa con papas.',
    contexto: 'La promoción es para pedidos para llevar el viernes. El precio se confirmará después.',
    formato: 'mensaje',
    tono: 'Cercano y directo.',
    limites: 'Deja marcadores para el precio y el horario. Usa únicamente la información dada.',
    criterios: 'Incluye una frase para invitar a pedir por WhatsApp.',
  },
  cortes: {
    objetivo: 'Haz una guía para preguntar qué corte de cabello quiere una persona antes de empezar.',
    contexto: 'Hago cortes clásicos con tijera o máquina. Quiero aclarar el largo, los laterales y el acabado.',
    formato: 'lista',
    tono: 'Amable y con palabras que cualquier cliente entienda.',
    criterios: 'Incluye cinco preguntas y una forma breve de confirmar el corte acordado.',
  },
  estetica: {
    objetivo: 'Redacta un mensaje para responder a una clienta que pregunta por pestañas y uñas postizas.',
    contexto: 'Vendo por WhatsApp. Confirmo el inventario y el precio cuando sé qué estilo busca.',
    formato: 'mensaje',
    tono: 'Amable y profesional.',
    limites: 'Evita inventar marcas, precios, existencias o resultados del producto.',
    criterios: 'Pregunta qué producto, estilo y cantidad le interesan.',
  },
  desarrollo: {
    objetivo: 'Explícame cómo validar un formulario antes de guardarlo en una aplicación web.',
    contexto: 'Uso HTML y JavaScript sin dependencias. El formulario tiene nombre y correo electrónico.',
    formato: 'guia',
    limites: 'Usa datos ficticios en el ejemplo y conserva la validación nativa cuando sea suficiente.',
    criterios: 'Incluye código, pruebas de entradas inválidas y qué validaciones se deben repetir en el servidor.',
    aclarar: true,
  },
};

const formatos = {
  pasos: 'Organiza la respuesta en pasos numerados.',
  lista: 'Presenta la respuesta en una lista con viñetas.',
  tabla: 'Presenta la información principal en una tabla con encabezados claros.',
  mensaje: 'Entrega un mensaje breve, listo para adaptar y enviar.',
  guia: 'Organiza la respuesta en una guía con secciones y títulos cortos.',
};

const editor = document.querySelector('#editor');
const selectorPlantilla = document.querySelector('#plantilla');
const limpiar = document.querySelector('#limpiar');
const opciones = document.querySelector('#opciones');
const cantidadOpciones = document.querySelector('#opciones-cantidad');
const resultado = document.querySelector('#resultado');
const sinPrompt = document.querySelector('#sin-prompt');
const copiar = document.querySelector('#copiar');
const estado = document.querySelector('#estado');
const abrirChatGPT = document.querySelector('#abrir-chatgpt');
const verPrompt = document.querySelector('#ver-prompt');
const idsCampos = [
  'objetivo', 'contexto', 'formato', 'formato-personalizado', 'rol',
  'tono', 'limites', 'criterios', 'aclarar',
];
const campos = Object.fromEntries(idsCampos.map(id => [id, document.getElementById(id)]));

let plantillaActiva = '';
let borradorInicial;

function leerBorrador() {
  return Object.fromEntries(idsCampos.map(id => {
    const campo = campos[id];
    const valor = campo.type === 'checkbox' ? campo.checked : campo.value.trim();
    return [id, valor];
  }));
}

function crearPrompt(borrador) {
  if (!borrador.objetivo) return '';

  const formato = borrador.formato === 'personalizado'
    ? borrador['formato-personalizado']
    : formatos[borrador.formato];
  const secciones = [
    ['Objetivo', borrador.objetivo],
    ['Contexto', borrador.contexto],
    ['Rol', borrador.rol],
    ['Formato de respuesta', formato],
    ['Tono', borrador.tono],
    ['Indicaciones', borrador.limites],
    ['Criterios para la respuesta', borrador.criterios],
    ['Si falta información', borrador.aclarar && 'Haz una pregunta breve si falta un dato indispensable. Si puedes avanzar, indica cualquier supuesto importante.'],
  ];

  return secciones
    .filter(([, contenido]) => contenido)
    .map(([titulo, contenido]) => `${titulo}\n${contenido}`)
    .join('\n\n');
}

function actualizarVista() {
  const borrador = leerBorrador();
  const prompt = crearPrompt(borrador);
  const hayPrompt = Boolean(prompt);
  const configuradas = [borrador.rol, borrador.tono, borrador.limites, borrador.criterios, borrador.aclarar]
    .filter(Boolean).length;

  campos['formato-personalizado'].hidden = borrador.formato !== 'personalizado';
  cantidadOpciones.hidden = configuradas === 0;
  cantidadOpciones.textContent = configuradas ? `(${configuradas})` : '';
  limpiar.disabled = !plantillaActiva && !Object.values(borrador).some(Boolean);
  sinPrompt.hidden = hayPrompt;
  resultado.hidden = !hayPrompt;
  copiar.disabled = !hayPrompt;
  abrirChatGPT.hidden = !hayPrompt;
  verPrompt.hidden = !hayPrompt;

  if (resultado.value !== prompt) {
    resultado.value = prompt;
    estado.textContent = '';
  }
}

function cargarPlantilla(id) {
  editor.reset();
  const plantilla = plantillas[id] ?? {};

  for (const [nombre, valor] of Object.entries(plantilla)) {
    const campo = campos[nombre];
    if (campo.type === 'checkbox') {
      campo.checked = valor;
    } else {
      campo.value = valor;
    }
  }

  plantillaActiva = id;
  selectorPlantilla.value = id;
  borradorInicial = JSON.stringify(leerBorrador());
  actualizarVista();
}

selectorPlantilla.addEventListener('change', () => {
  const borrador = leerBorrador();
  const tieneCambios = JSON.stringify(borrador) !== borradorInicial && Object.values(borrador).some(Boolean);

  if (tieneCambios && !window.confirm('Cambiar de plantilla reemplazará lo que escribiste. ¿Quieres continuar?')) {
    selectorPlantilla.value = plantillaActiva;
    return;
  }

  cargarPlantilla(selectorPlantilla.value);
});

editor.addEventListener('input', actualizarVista);
campos.formato.addEventListener('change', actualizarVista);
editor.addEventListener('submit', evento => evento.preventDefault());

limpiar.addEventListener('click', () => {
  cargarPlantilla('');
  opciones.open = false;
  campos.objetivo.focus();
});

copiar.addEventListener('click', async () => {
  const texto = resultado.value;
  if (!texto) return;

  try {
    await navigator.clipboard.writeText(texto);
    if (texto === resultado.value) estado.textContent = 'Prompt copiado.';
  } catch {
    if (texto !== resultado.value) return;
    resultado.focus();
    resultado.select();
    estado.textContent = 'Texto seleccionado. Usa el comando Copiar de tu dispositivo.';
  }
});

const tema = document.querySelector('#tema');
const claveTema = 'laboratorio-de-prompts:tema';
const temaDelSistema = window.matchMedia('(prefers-color-scheme: dark)');
let preferencia;

try {
  preferencia = localStorage.getItem(claveTema);
} catch {
  // El selector también funciona cuando el navegador restringe el almacenamiento.
}

function mostrarTema(valor) {
  document.documentElement.dataset.theme = valor;
  tema.setAttribute('aria-checked', String(valor === 'dark'));
}

function seguirTemaDelSistema() {
  if (preferencia !== 'dark' && preferencia !== 'light') {
    mostrarTema(temaDelSistema.matches ? 'dark' : 'light');
  }
}

if (preferencia === 'dark' || preferencia === 'light') {
  mostrarTema(preferencia);
} else {
  seguirTemaDelSistema();
}

temaDelSistema.addEventListener('change', seguirTemaDelSistema);

tema.addEventListener('click', () => {
  preferencia = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  mostrarTema(preferencia);

  try {
    localStorage.setItem(claveTema, preferencia);
  } catch {
    // La preferencia se conserva mientras la página esté abierta.
  }
});

cargarPlantilla('');
