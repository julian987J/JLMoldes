import Edit from "../Edit";
const Coluna = () => {
  return (
    <>
      <div className="overflow-x-auto rounded-box border border-warning  bg-base-100">
        <table className="table table-xs">
          <thead>
            <tr>
              <th className="hidden">ID</th>
              <th>Sim</th>
              <th>Não</th>
              <th>M1</th>
              <th>M2</th>
              <th>Des</th>
              <th>Data</th>
              <th>Inicio</th>
              <th>Fim</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-warning">
              <td>%</td>
              <td>%</td>
              <td>0.00</td>
              <td>0.00</td>
              <td>0.00</td>
              <td>10/10/10</td>
              <td>00:00</td>
              <td>00:00</td>
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
