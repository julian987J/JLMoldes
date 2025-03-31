import Edit from "../Edit";
const Coluna = () => {
  return (
    <>
      <div className="w-240 overflow-x-auto rounded-box border border-success  bg-base-100">
        <table className="table table-xs">
          <thead>
            <tr>
              <th className="hidden">ID</th>
              <th>Data</th>
              <th>Nome</th>
              <th>M</th>
              <th>Papel</th>
              <th className="bg-accent">R$</th>
              <th className="bg-accent">PIX</th>
              <th className="bg-success">Enc-R$</th>
              <th className="bg-success">Enc-PIX</th>
              <th className="bg-warning-content/50">Des</th>
              <th className="bg-warning-content/50">Util</th>
              <th className="bg-warning-content/50">Perdida</th>
              <th>Comentarios</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-success">
              <td>10/10/10</td>
              <td>Judha</td>
              <td>7</td>
              <td>45</td>
              <td className="bg-accent/50">0.00</td>
              <td className="bg-accent/50">0.00</td>
              <td className="bg-success/50">0.00</td>
              <td className="bg-success/50">0.00</td>
              <td className="bg-warning-content/20">0.00</td>
              <td className="bg-warning-content/20">Util</td>
              <td className="bg-warning-content/20">Perdida</td>
              <td>Comentarios</td>
              <td>
                <Edit />
                <button
                  className={`btn btn-xs btn-soft btn-error "hidden" : ""}`}
                >
                  Excluir
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Coluna;
