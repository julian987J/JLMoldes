exports.up = (pgm) => {
  // Cria a tabela
  pgm.createTable("Deve", {
    data: { type: "timestamptz", notNull: true },
    codigo: { type: "text", notNull: true },
    r: { type: "numeric", notNull: true },
    nome: { type: "text", notNull: true },
    valor: { type: "numeric", notNull: true },
  });

  // Cria a função do trigger
  pgm.sql(`
    CREATE OR REPLACE FUNCTION excluir_linha_se_valor_zero()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.valor = 0 THEN
        DELETE FROM "Deve" WHERE data = NEW.data AND codigo = NEW.codigo;
        RETURN NULL;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Cria o trigger
  pgm.sql(`
    CREATE TRIGGER trigger_excluir_valor_zero
    AFTER INSERT OR UPDATE ON "Deve"
    FOR EACH ROW EXECUTE FUNCTION excluir_linha_se_valor_zero();
  `);
};

exports.down = false;
