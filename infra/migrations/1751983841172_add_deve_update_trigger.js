exports.up = (pgm) => {
  // Cria a função que será executada pelo gatilho BEFORE UPDATE
  pgm.createFunction(
    "archive_to_aviso_on_deve_update",
    [],
    {
      returns: "trigger",
      language: "plpgsql",
      replace: true, // Permite substituir a função se ela já existir
    },
    `
    BEGIN
      -- Verifica se o valor está sendo atualizado para 0 ou menos, e se o valor antigo era maior que 0.
      -- Isso garante que a ação ocorra apenas quando uma dívida é efetivamente paga.
      IF NEW.valor <= 0 AND OLD.valor > 0 THEN
        -- Insere os dados da linha ANTES da atualização (OLD) na tabela "Aviso".
        -- ON CONFLICT (avisoid) DO NOTHING evita erros se a linha já foi arquivada por outro processo.
        INSERT INTO "Aviso" (avisoid, data, codigo, r, nome, valorpapel, valorcomissao, valor)
        VALUES (OLD.deveid, OLD.data, OLD.codigo, OLD.r, OLD.nome, OLD.valorpapel, OLD.valorcomissao, OLD.valor)
        ON CONFLICT (avisoid) DO NOTHING;
      END IF;
      
      -- Retorna a nova linha (NEW) para que a operação de UPDATE continue normalmente.
      RETURN NEW;
    END;
    `,
  );

  // Cria o gatilho na tabela "Deve" que chama a função ANTES de uma atualização
  pgm.createTrigger("Deve", "trigger_archive_on_update", {
    when: "BEFORE",
    operation: "UPDATE",
    level: "ROW", // Executa para cada linha atualizada
    function: "archive_to_aviso_on_deve_update",
  });
};

exports.down = (pgm) => {
  // Remove o gatilho primeiro
  pgm.dropTrigger("Deve", "trigger_archive_on_update");

  // Depois remove a função
  pgm.dropFunction("archive_to_aviso_on_deve_update");
};
