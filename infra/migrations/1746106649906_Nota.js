exports.up = (pgm) => {
  pgm.createTable("Nota", {
    id: { type: "serial", primaryKey: true },
    r: { type: "numeric", notNull: true },
    colum: { type: "numeric", notNull: true },
    texto: { type: "text", notNull: true },
  });
};

exports.down = false;
