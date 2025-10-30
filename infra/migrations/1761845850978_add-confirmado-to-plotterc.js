exports.up = (pgm) => {
  pgm.addColumn("PlotterC", {
    confirmado: {
      type: "boolean",
      notNull: true,
      default: false,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn("PlotterC", "confirmado");
};
