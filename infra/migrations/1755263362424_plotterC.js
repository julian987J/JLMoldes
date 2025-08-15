exports.up = (pgm) => {
  pgm.createTable("PlotterC", {
    id: { type: "serial", primaryKey: true },
    r: { type: "numeric", notNull: true },
    sim: { type: "numeric", notNull: true },
    nao: { type: "numeric", notNull: true },
    m1: { type: "numeric", notNull: true },
    m2: { type: "numeric", notNull: true },
    desperdicio: { type: "numeric", notNull: true },
    data: { type: "text", notNull: true },
    inicio: { type: "text", notNull: true },
    fim: { type: "text", notNull: true },
  });
};

exports.down = false;
