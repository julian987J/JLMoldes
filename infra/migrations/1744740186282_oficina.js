exports.up = (pgm) => {
  pgm.createTable("Oficina", {
    id: { type: "serial", primaryKey: true },
    dec: { type: "text", notNull: true },
    item: { type: "text", notNull: true },
    quantidade: { type: "numeric", notNull: true },
    unidade: { type: "numeric", notNull: true },
    valor: { type: "numeric", notNull: true },
    gastos: { type: "text", notNull: true },
    pago: { type: "timestamptz", notNull: true },
    proximo: { type: "timestamptz", notNull: false },
    dia: { type: "numeric", notNull: false },
    alerta: { type: "numeric", notNull: true },
  });
};

exports.down = false;
