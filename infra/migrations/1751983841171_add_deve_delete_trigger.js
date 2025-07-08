exports.up = (pgm) => {
  // 1. Cria a função que será executada pelo gatilho
  pgm.createFunction(
    "move_to_aviso_on_deve_delete",
    [],
    {
      returns: "trigger",
      language: "plpgsql",
    },
    `
    BEGIN
      -- Insere os dados da linha excluída (OLD) na tabela "Aviso".
      -- ON CONFLICT (avisoid) DO NOTHING evita que a inserção ocorra se o registro
      -- já foi arquivado pelo gatilho de UPDATE, prevenindo duplicatas.
      INSERT INTO "Aviso" (avisoid, data, codigo, r, nome, valorpapel, valorcomissao, valor)
      VALUES (OLD.deveid, OLD.data, OLD.codigo, OLD.r, OLD.nome, OLD.valorpapel, OLD.valorcomissao, OLD.valor)
      ON CONFLICT (avisoid) DO NOTHING;
      
      -- Retorna a linha antiga para finalizar a operação de DELETE
      RETURN OLD;
    END;
    `,
  );

  // 2. Cria o gatilho na tabela "Deve" que chama a função após uma exclusão
  pgm.createTrigger("Deve", "trigger_move_to_aviso", {
    when: "AFTER",
    operation: "DELETE",
    level: "ROW", // Executa para cada linha excluída
    function: "move_to_aviso_on_deve_delete",
  });
};

exports.down = (pgm) => {
  // Remove o gatilho primeiro
  pgm.dropTrigger("Deve", "trigger_move_to_aviso");

  // Depois remove a função
  pgm.dropFunction("move_to_aviso_on_deve_delete");
};
