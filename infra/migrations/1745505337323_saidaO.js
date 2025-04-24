exports.up = (pgm) => {
  pgm.createTable("SaidaO", {
    id: { type: "serial", primaryKey: true },
    dec: { type: "text", notNull: true },
    oficina: { type: "text", notNull: true },
    gastos: { type: "text", notNull: true },
    valor: { type: "numeric", notNull: true },
    pago: { type: "timestamptz", notNull: true },
  });
};

exports.down = false;
