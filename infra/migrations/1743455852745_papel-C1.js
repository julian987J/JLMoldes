exports.up = (pgm) => {
  pgm.createTable("PapelC1", {
    id: { type: "numeric", notNull: true },
    data: { type: "timestamptz", notNull: true },
    nome: { type: "text", notNull: true },
    multi: { type: "numeric", notNull: true },
    papel: { type: "numeric", notNull: true },
    papelPix: { type: "numeric", notNull: true },
    papelReal: { type: "numeric", notNull: true },
    encaixeReal: { type: "numeric", notNull: true },
    encaixePix: { type: "numeric", notNull: true },
    desperdicio: { type: "numeric", notNull: true },
    util: { type: "numeric", notNull: true },
    perdida: { type: "numeric", notNull: true },
    comentarios: { type: "text", notNull: true },
  });
};

exports.down = false;
