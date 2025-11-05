/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.renameColumn("C", "DataFim", "dtfim");
  pgm.renameColumn("PapelC", "DataFim", "dtfim");
  pgm.renameColumn("PlotterC", "DataFim", "dtfim");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.renameColumn("C", "dtfim", "DataFim");
  pgm.renameColumn("PapelC", "dtfim", "DataFim");
  pgm.renameColumn("PlotterC", "dtfim", "DataFim");
};
