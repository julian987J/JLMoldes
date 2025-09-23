exports.up = (pgm) => {
  pgm.addColumn("PlotterC", {
    nome: { type: "text" },
    largura: {
      type: "DOUBLE PRECISION",
    },
  });
  pgm.dropColumns("PlotterC", ["m1", "m2"]);
};

exports.down = (pgm) => {
  pgm.dropColumns("PlotterC", ["nome", "largura"]);
  pgm.addColumns("PlotterC", {
    m1: { type: "DOUBLE PRECISION", notNull: true, default: 0 },
    m2: { type: "DOUBLE PRECISION", notNull: true, default: 0 },
  });
};
