exports.up = (pgm) => {
  pgm.alterColumn("PlotterC", "r", {
    type: "DOUBLE PRECISION",
    using: "r::double precision",
  });
  pgm.alterColumn("PlotterC", "sim", {
    type: "DOUBLE PRECISION",
    using: "sim::double precision",
  });
  pgm.alterColumn("PlotterC", "nao", {
    type: "DOUBLE PRECISION",
    using: "nao::double precision",
  });
  pgm.alterColumn("PlotterC", "m1", {
    type: "DOUBLE PRECISION",
    using: "m1::double precision",
  });
  pgm.alterColumn("PlotterC", "m2", {
    type: "DOUBLE PRECISION",
    using: "m2::double precision",
  });
  pgm.alterColumn("PlotterC", "desperdicio", {
    type: "DOUBLE PRECISION",
    using: "desperdicio::double precision",
  });
};

exports.down = (pgm) => {
  pgm.alterColumn("PlotterC", "r", { type: "NUMERIC" });
  pgm.alterColumn("PlotterC", "sim", { type: "NUMERIC" });
  pgm.alterColumn("PlotterC", "nao", { type: "NUMERIC" });
  pgm.alterColumn("PlotterC", "m1", { type: "NUMERIC" });
  pgm.alterColumn("PlotterC", "m2", { type: "NUMERIC" });
  pgm.alterColumn("PlotterC", "desperdicio", { type: "NUMERIC" });
};
