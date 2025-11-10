/* eslint-disable camelcase */

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
  pgm.createTable("semanal", {
    id: { type: "serial", primaryKey: true },
    data: { type: "timestamptz", notNull: true },
    real: { type: "numeric", notNull: true },
    pix: { type: "numeric", notNull: true },
    r: { type: "numeric", notNull: true },
    dtfim: {
      type: "date",
      default: null,
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("semanal");
};
