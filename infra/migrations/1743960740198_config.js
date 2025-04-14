exports.up = (pgm) => {
  pgm.createTable("config", {
    id: {
      type: "serial",
      primaryKey: true,
    },
    m: {
      type: "numeric",
      notNull: true,
    },
    e: {
      type: "numeric",
      notNull: true,
    },
    d: {
      type: "numeric",
      notNull: true,
    },
  });

  pgm.sql(`
    INSERT INTO config (m, e, d) 
    VALUES (7, 5, 0.06)
  `);
};

exports.down = false;
