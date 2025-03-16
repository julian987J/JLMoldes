exports.up = (pgm) => {
  pgm.createTable("m1table", {
    id: { type: "serial", primaryKey: true },
    data: { type: "date", notNull: true },
    descricao: { type: "text", notNull: true },
    dec: { type: "text", notNull: true },
    nome: { type: "text", notNull: true },
    sis: { type: "numeric", notNull: true },
    base: { type: "numeric", notNull: true },
    alt: { type: "numeric", notNull: true },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("m1table");
};
