import Edit from "../Edit";
const Coluna = () => {
  return (
    <>
      <div className="w-100 overflow-x-auto rounded-box border border-base-content/5  bg-base-100">
        <table className="table table-xs">
          <thead>
            <tr>
              <th className="hidden">ID</th>
              <th>Nome</th>
              <th>Base</th>
              <th>Sis</th>
              <th>Alt</th>
              <th>R$</th>
              <th>PIX</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-700">
              <td>Nome</td>
              <td>Base</td>
              <td>Sis</td>
              <td>Alt</td>
              <td>0.00</td>
              <td>0.00</td>
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
