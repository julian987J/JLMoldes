/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("TContentAno", {
    id: { type: "serial", primaryKey: true },
    ano: { type: "integer", notNull: true },
    r: { type: "integer", notNull: true },
    oficina: { type: "text", notNull: true },
    papel_data: { type: "jsonb", notNull: true },
    despesas_data: { type: "jsonb", notNull: true },
    encaixes_data: { type: "jsonb", notNull: true },
    bobinas_data: { type: "jsonb", notNull: true },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  // Adiciona constraint unique para prevenir duplicatas
  pgm.addConstraint("TContentAno", "unique_ano_r_oficina", {
    unique: ["ano", "r", "oficina"],
  });

  // Adiciona índices para melhorar performance de queries
  pgm.createIndex("TContentAno", "ano");
  pgm.createIndex("TContentAno", "r");
  pgm.createIndex("TContentAno", "oficina");
};

exports.down = (pgm) => {
  pgm.dropTable("TContentAno");
};
