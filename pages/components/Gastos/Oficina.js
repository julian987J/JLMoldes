import Edit from "../Edit";
const Oficina = () => {
  return (
    <div className="overflow-x-auto rounded-box border border-secondary  bg-base-100">
      <table className="table table-xs">
        <thead>
          <tr>
            <th className="hidden">ID</th>
            <th>Item</th>
            <th>Quantidade</th>
            <th>Unidade</th>
            <th>Valor</th>
            <th>Gastos</th>
            <th>Pago</th>
            <th>Proximo</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Carro</td>
            <td>100</td>
            <td>1</td>
            <td>20,00</td>
            <td>IPVA</td>
            <td>10/16/2025</td>
            <td>12/16/2025</td>
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
  );
};

export default Oficina;
