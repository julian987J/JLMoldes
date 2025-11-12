/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns("C", {
    DataFim: {
      type: "date",
      default: null,
    },
  });
  pgm.addColumns("PapelC", {
    DataFim: {
      type: "date",
      default: null,
    },
  });
  pgm.addColumns("PlotterC", {
    DataFim: {
      type: "date",
      default: null,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns("C", ["DataFim"]);
  pgm.dropColumns("PapelC", ["DataFim"]);
  pgm.dropColumns("PlotterC", ["DataFim"]);
};
