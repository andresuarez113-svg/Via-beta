import type { BotEdge, BotNode, FlowSnapshot } from "./types";

function n(
  id: string,
  kind: BotNode["data"]["kind"],
  x: number,
  y: number,
  data: Partial<BotNode["data"]> & { title: string },
): BotNode {
  return {
    id,
    type: "bot",
    position: { x, y },
    data: {
      kind,
      title: data.title,
      text: data.text ?? "",
      options: data.options ?? [],
      variable: data.variable ?? "",
      aiPrompt: data.aiPrompt ?? "",
      listButton: data.listButton ?? "",
    },
    deletable: kind !== "start",
  };
}

function e(
  source: string,
  target: string,
  sourceHandle?: string,
): BotEdge {
  return {
    id: `e_${source}_${sourceHandle ?? "out"}_${target}`,
    source,
    target,
    sourceHandle,
    type: "smoothstep",
  };
}

const cafe: FlowSnapshot = {
  name: "Café Vía",
  identity: { business: "Café Vía", about: "Pedidos · Cuenta de negocio" },
  nodes: [
    n("start", "start", 24, 210, { title: "Inicio" }),
    n("welcome", "message", 250, 190, {
      title: "Bienvenida",
      text: "Hola, soy Nexo, el bot de Café Vía. Te tomo el pedido en un momento.",
    }),
    n("menu", "question", 490, 160, {
      title: "Carta",
      text: "¿Qué se te antoja hoy?",
      variable: "pedido",
      options: [
        { id: "cafe", label: "Café" },
        { id: "te", label: "Té" },
        { id: "postre", label: "Postre" },
      ],
    }),
    n("cafe-how", "question", 760, 8, {
      title: "Tipo de café",
      text: "¿Cómo lo quieres?",
      variable: "detalle",
      options: [
        { id: "espresso", label: "Espresso" },
        { id: "latte", label: "Latte" },
        { id: "americano", label: "Americano" },
      ],
    }),
    n("tea-how", "question", 760, 210, {
      title: "Tipo de té",
      text: "Elige tu infusión.",
      variable: "detalle",
      options: [
        { id: "verde", label: "Verde" },
        { id: "negro", label: "Negro" },
        { id: "manzanilla", label: "Manzanilla" },
      ],
    }),
    n("dessert", "question", 760, 412, {
      title: "Postre",
      text: "Hoy hay dos cosas ricas.",
      variable: "detalle",
      options: [
        { id: "muffin", label: "Muffin" },
        { id: "galleta", label: "Galleta de avena" },
      ],
    }),
    n("name", "input", 1030, 190, {
      title: "Nombre",
      text: "¿A nombre de quién lo dejamos?",
      variable: "nombre",
    }),
    n("confirm", "message", 1280, 190, {
      title: "Confirmación",
      text: "Listo, {nombre}. Preparamos tu {pedido} {detalle} y te aviso cuando esté.",
    }),
    n("end", "end", 1530, 210, {
      title: "Fin",
      text: "Gracias por pasar. Que esté rico.",
    }),
  ],
  edges: [
    e("start", "welcome"),
    e("welcome", "menu"),
    e("menu", "cafe-how", "cafe"),
    e("menu", "tea-how", "te"),
    e("menu", "dessert", "postre"),
    e("cafe-how", "name", "espresso"),
    e("cafe-how", "name", "latte"),
    e("cafe-how", "name", "americano"),
    e("tea-how", "name", "verde"),
    e("tea-how", "name", "negro"),
    e("tea-how", "name", "manzanilla"),
    e("dessert", "name", "muffin"),
    e("dessert", "name", "galleta"),
    e("name", "confirm"),
    e("confirm", "end"),
  ],
};

const support: FlowSnapshot = {
  name: "Soporte Nexo",
  identity: { business: "Nexo Soporte", about: "Atención · Cuenta de negocio" },
  nodes: [
    n("start", "start", 24, 190, { title: "Inicio" }),
    n("welcome", "message", 250, 170, {
      title: "Bienvenida",
      text: "Hola, soy el bot de soporte de Nexo. Cuéntame qué te trae.",
    }),
    n("topic", "question", 490, 140, {
      title: "Tema",
      text: "¿Sobre qué es tu consulta?",
      variable: "tema",
      options: [
        { id: "pedido", label: "Mi pedido" },
        { id: "cuenta", label: "Mi cuenta" },
        { id: "humano", label: "Hablar con alguien" },
      ],
    }),
    n("order", "input", 760, 8, {
      title: "Nº de pedido",
      text: "Pásame el número de pedido (algo como NX-1042).",
      variable: "pedido_id",
    }),
    n("order-ok", "message", 1010, 8, {
      title: "Estado",
      text: "Encontré el {pedido_id}: va en camino y llega mañana por la mañana.",
    }),
    n("account", "question", 760, 190, {
      title: "Cuenta",
      text: "¿Qué necesitas hacer?",
      options: [
        { id: "pass", label: "Cambiar contraseña" },
        { id: "mail", label: "Cambiar correo" },
      ],
    }),
    n("pass", "message", 1010, 150, {
      title: "Contraseña",
      text: "Te envié un enlace de restablecimiento al correo de la cuenta. Caduca en 30 minutos.",
    }),
    n("mail", "message", 1010, 290, {
      title: "Correo",
      text: "Para cambiar el correo, confirma el actual desde Ajustes → Cuenta. Si no tienes acceso, elige hablar con alguien.",
    }),
    n("human", "message", 760, 400, {
      title: "Handoff",
      text: "Te paso con una persona del equipo. El horario es de 9 a 18, hora de Madrid.",
    }),
    n("end", "end", 1280, 190, {
      title: "Fin",
      text: "Cuando quieras, aquí estoy. Que te vaya bien.",
    }),
  ],
  edges: [
    e("start", "welcome"),
    e("welcome", "topic"),
    e("topic", "order", "pedido"),
    e("topic", "account", "cuenta"),
    e("topic", "human", "humano"),
    e("order", "order-ok"),
    e("order-ok", "end"),
    e("account", "pass", "pass"),
    e("account", "mail", "mail"),
    e("pass", "end"),
    e("mail", "end"),
    e("human", "end"),
  ],
};

const clinic: FlowSnapshot = {
  name: "Citas clínica",
  identity: { business: "Clínica Vía", about: "Citas · Cuenta de negocio" },
  nodes: [
    n("start", "start", 24, 190, { title: "Inicio" }),
    n("welcome", "message", 250, 170, {
      title: "Recepción",
      text: "Bienvenida a Clínica Vía. Puedo ayudarte a agendar o resolver una duda rápida.",
    }),
    n("intent", "question", 490, 140, {
      title: "Intención",
      text: "¿Qué quieres hacer?",
      variable: "intencion",
      options: [
        { id: "cita", label: "Agendar cita" },
        { id: "horario", label: "Horarios" },
        { id: "duda", label: "Una duda" },
      ],
    }),
    n("when", "question", 760, 8, {
      title: "Día",
      text: "Tenemos hueco esta semana. ¿Qué día te va mejor?",
      variable: "dia",
      options: [
        { id: "mar", label: "Martes 10:30" },
        { id: "jue", label: "Jueves 17:00" },
        { id: "vie", label: "Viernes 9:15" },
      ],
    }),
    n("who", "input", 1010, 8, {
      title: "Paciente",
      text: "¿A nombre de quién reservamos?",
      variable: "nombre",
    }),
    n("booked", "message", 1260, 8, {
      title: "Reserva",
      text: "Listo, {nombre}. Cita el {dia}. Te llega un recordatorio el día anterior.",
    }),
    n("hours", "message", 760, 230, {
      title: "Horario",
      text: "Abrimos de lunes a viernes, 9:00–14:00 y 16:00–19:30. Urgencias odontológicas, llama al 900 000 123.",
    }),
    n("ai", "ai", 760, 380, {
      title: "Duda",
      text: "",
      aiPrompt:
        "Eres recepcionista de una clínica dental amable y breve. No diagnostiques. Si es urgente, pide llamar. Responde en 1-3 frases, sin markdown.",
    }),
    n("end", "end", 1260, 230, {
      title: "Fin",
      text: "Gracias. Te esperamos.",
    }),
  ],
  edges: [
    e("start", "welcome"),
    e("welcome", "intent"),
    e("intent", "when", "cita"),
    e("intent", "hours", "horario"),
    e("intent", "ai", "duda"),
    e("when", "who", "mar"),
    e("when", "who", "jue"),
    e("when", "who", "vie"),
    e("who", "booked"),
    e("booked", "end"),
    e("hours", "end"),
    e("ai", "end"),
  ],
};

export const TEMPLATES: { id: string; blurb: string; flow: FlowSnapshot }[] = [
  {
    id: "cafe",
    blurb: "Pedido en un café: bebida, detalle y nombre.",
    flow: cafe,
  },
  {
    id: "support",
    blurb: "Soporte: pedido, cuenta o hablar con alguien.",
    flow: support,
  },
  {
    id: "clinic",
    blurb: "Clínica: agenda, horarios y dudas con IA.",
    flow: clinic,
  },
];

export const DEFAULT_FLOW = cafe;
