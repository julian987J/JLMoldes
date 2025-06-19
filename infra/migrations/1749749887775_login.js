exports.up = (pgm) => {
  pgm.createTable("users", {
    id: { type: "serial", primaryKey: true },
    usuario: { type: "text", notNull: true },
    senha: { type: "text", notNull: true },
    role: { type: "text", notNull: true },
  });

  pgm.sql(`
    INSERT INTO users (usuario, senha, role) VALUES ('admin', '123456', 'admin');
    INSERT INTO users (usuario, senha, role) VALUES ('funcr1', '123456', 'FuncionarioR1');
    INSERT INTO users (usuario, senha, role) VALUES ('funcr2', '123456', 'FuncionarioR2');
    INSERT INTO users (usuario, senha, role) VALUES ('funcr3', '123456', 'FuncionarioR3');
  `);
};

exports.down = false;
