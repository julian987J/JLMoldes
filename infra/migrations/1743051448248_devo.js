exports.up = (pgm) => {
  pgm.createTable("Devo", {
    data: { type: "timestamptz", default: pgm.func("now()"), notNull: true },
    codigo: { type: "text", notNull: true },
    r: { type: "numeric", notNull: true },
    nome: { type: "text", notNull: true },
    valor: { type: "numeric", notNull: true },
  });
};

exports.down = false;
