exports.up = (pgm) => {
  pgm.createTable("users", {
    id: { type: "serial", primaryKey: true },
    usuario: { type: "text", notNull: true },
    senha: { type: "text", notNull: true },
  });

  pgm.sql(`
    INSERT INTO users (usuario, senha) VALUES ('admin', '123456');
    INSERT INTO users (usuario, senha) VALUES ('funcionario', '123456');
  `);
};

exports.down = false;
