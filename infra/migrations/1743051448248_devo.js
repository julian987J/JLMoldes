exports.up = (pgm) => {
  pgm.createTable("Devo", {
    id: { type: "serial", primaryKey: true },
    data: { type: "timestamptz", default: pgm.func("now()"), notNull: true },
    codigo: { type: "text", notNull: true },
    nome: { type: "text", notNull: true },
    valor: { type: "numeric", notNull: true },
  });
};

exports.down = false;
