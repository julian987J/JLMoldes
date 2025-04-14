exports.up = (pgm) => {
  pgm.createTable("Pessoal", {
    id: { type: "serial", primaryKey: true },
    dec: { type: "text", notNull: true },
    item: { type: "text", notNull: true },
    quantidade: { type: "numeric", notNull: true },
    unidade: { type: "numeric", notNull: true },
    valor: { type: "numeric", notNull: true },
    gastos: { type: "text", notNull: true },
    dataPago: { type: "timestamptz", notNull: true },
    dataProximo: { type: "timestamptz", notNull: true },
  });
};

exports.down = false;
