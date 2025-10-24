exports.up = (pgm) => {
  pgm.addColumn("PlotterC", {
    plotter_nome: { type: "text" },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn("PlotterC", "plotter_nome");
};
