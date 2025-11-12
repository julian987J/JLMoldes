/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.alterColumn("PlotterC", "confirmado", {
    default: true,
  });
};

exports.down = (pgm) => {
  pgm.alterColumn("PlotterC", "confirmado", {
    default: false,
  });
};
