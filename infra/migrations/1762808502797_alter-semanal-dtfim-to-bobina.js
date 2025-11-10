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
  pgm.renameColumn("semanal", "dtfim", "bobina");
  pgm.alterColumn("semanal", "bobina", {
    type: "text",
    default: null,
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.alterColumn("semanal", "bobina", {
    type: "date",
    default: null,
  });
  pgm.renameColumn("semanal", "bobina", "dtfim");
};
