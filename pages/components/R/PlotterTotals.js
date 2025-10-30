import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import Execute from "models/functions";
import { useWebSocket } from "../../../contexts/WebSocketContext";

const formatNumber = (value) => {
  const number = parseFloat(value);
  return isNaN(number) ? "0.00" : number.toFixed(2);
};

const PlotterTotals = ({ r }) => {
  const [dados, setDados] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const { lastMessage } = useWebSocket();
  const lastProcessedTimestampRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (typeof r === "undefined" || r === null) return;
    setLoading(true);
    try {
      const [plotterResults, configResult] = await Promise.all([
        Execute.receiveFromPlotterC(r),
        Execute.receiveFromConfig(),
      ]);

      setDados(
        Array.isArray(plotterResults)
          ? plotterResults.sort(
              (a, b) =>
                new Date(b.data) - new Date(a.data) ||
                new Date(b.inicio) - new Date(a.inicio),
            )
          : [],
      );

      if (Array.isArray(configResult) && configResult.length > 0) {
        setConfig(configResult[0]);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  }, [r]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (lastMessage && lastMessage.data && lastMessage.timestamp) {
      if (
        lastProcessedTimestampRef.current &&
        lastMessage.timestamp <= lastProcessedTimestampRef.current
      ) {
        return;
      }

      const { type, payload } = lastMessage.data;

      if (
        (type === "PLOTTER_C_NEW_ITEM" || type === "PLOTTER_C_UPDATED_ITEM") &&
        payload &&
        String(payload.r) === String(r)
      ) {
        setDados((prevDados) => {
          let newDados = [...prevDados];
          const itemIndex = newDados.findIndex(
            (item) => String(item.id) === String(payload.id),
          );

          if (itemIndex !== -1) {
            newDados[itemIndex] = payload;
          } else {
            newDados.push(payload);
          }

          return newDados.sort(
            (a, b) =>
              new Date(b.data) - new Date(a.data) ||
              new Date(b.inicio) - new Date(a.inicio),
          );
        });
      } else if (
        type === "PLOTTER_C_DELETED_ITEM" &&
        payload &&
        payload.id !== undefined
      ) {
        setDados((prevDados) =>
          prevDados.filter((item) => String(item.id) !== String(payload.id)),
        );
      }

      if (type === "CONFIG_UPDATED_ITEM" && payload) {
        setConfig(payload);
      }

      lastProcessedTimestampRef.current = lastMessage.timestamp;
    }
  }, [lastMessage, r]);

  const desperdicioConfig = config ? parseFloat(config.d) || 0 : 0;

  const dadosP01 = dados.filter((item) => item.plotter_nome === "P01");
  const dadosP02 = dados.filter((item) => item.plotter_nome === "P02");

  const totalM1_P01 = dadosP01.reduce((acc, item) => {
    const larguraTotalCm = parseFloat(item.largura) + desperdicioConfig;
    const m1Value = (parseFloat(item.sim) / 100) * (larguraTotalCm / 100);
    return acc + m1Value;
  }, 0);
  const totalM2_P01 = dadosP01.reduce((acc, item) => {
    const larguraTotalCm = parseFloat(item.largura) + desperdicioConfig;
    const m2Value = (parseFloat(item.nao) / 100) * (larguraTotalCm / 100);
    return acc + m2Value;
  }, 0);

  const totalM1_P02 = dadosP02.reduce((acc, item) => {
    const larguraTotalCm = parseFloat(item.largura) + desperdicioConfig;
    const m1Value = (parseFloat(item.sim) / 100) * (larguraTotalCm / 100);
    return acc + m1Value;
  }, 0);
  const totalM2_P02 = dadosP02.reduce((acc, item) => {
    const larguraTotalCm = parseFloat(item.largura) + desperdicioConfig;
    const m2Value = (parseFloat(item.nao) / 100) * (larguraTotalCm / 100);
    return acc + m2Value;
  }, 0);

  const totalP01 = totalM1_P01 + totalM2_P01;
  const totalP02 = totalM1_P02 + totalM2_P02;

  const countM1 = dados.filter((item) => parseFloat(item.sim) > 0).length;
  const countM2 = dados.filter((item) => parseFloat(item.nao) > 0).length;

  const groupedConfirmedData = useMemo(() => {
    const confirmed = dados.filter((item) => item.confirmado);
    return confirmed.reduce((acc, item) => {
      const dateKey = item.data.substring(0, 10); // YYYY-MM-DD
      if (!acc[dateKey]) {
        acc[dateKey] = { p01: [], p02: [] };
      }
      if (item.plotter_nome === "P01") {
        acc[dateKey].p01.push(item);
      } else if (item.plotter_nome === "P02") {
        acc[dateKey].p02.push(item);
      }
      return acc;
    }, {});
  }, [dados]);

  if (loading) {
    return <div className="text-center p-1">Carregando...</div>;
  }

  return (
    <div className="overflow-x-auto rounded-box border border-warning bg-base-100 p-1">
      <div className="flex justify-around text-center p-1">
        <div className="badge badge-info">{countM1}</div>
        <div className="badge badge-error">{countM2}</div>
      </div>
      <table className="table table-xs text-center">
        <thead>
          <tr>
            <th colSpan={2} className="bg-primary-content">
              P01
            </th>
            <th colSpan={2} className="bg-secondary-content">
              P02
            </th>
          </tr>
          <tr>
            <th colSpan={2} className="bg-primary-content">
              {formatNumber(totalP01)}m
            </th>
            <th colSpan={2} className="bg-secondary-content">
              {formatNumber(totalP02)}m
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="bg-info/30">{formatNumber(totalM1_P01)}m</td>
            <td className="bg-error/30">{formatNumber(totalM2_P01)}m</td>
            <td className="bg-info/30">{formatNumber(totalM1_P02)}m</td>
            <td className="bg-error/30">{formatNumber(totalM2_P02)}m</td>
          </tr>
        </tbody>
      </table>
      <div className="mt-4">
        {Object.entries(groupedConfirmedData)
          .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
          .map(([date, { p01, p02 }]) => (
            <div key={date} className="mb-2">
              <div className="font-bold text-sm bg-gray-200 text-center p-1">
                {date}
              </div>
              <div className="flex">
                <div className="w-1/2 pr-1">
                  {p01.length > 0 && (
                    <table className="table table-xs">
                      <tbody>
                        {p01.map((item) => {
                          const larguraTotal =
                            parseFloat(item.largura) + desperdicioConfig;
                          const m1Value =
                            ((parseFloat(item.sim) / 100) * larguraTotal) / 100;
                          const m2Value =
                            ((parseFloat(item.nao) / 100) * larguraTotal) / 100;
                          return (
                            <tr
                              key={item.id}
                              className="border-b border-warning"
                            >
                              <td className="text-center bg-info/30">
                                {formatNumber(m1Value)}
                              </td>
                              <td className="text-center bg-error/30">
                                {formatNumber(m2Value)}
                              </td>
                              <td className="text-center bg-success/30">
                                {item.nome}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="w-1/2 pl-1">
                  {p02.length > 0 && (
                    <table className="table table-xs">
                      <tbody>
                        {p02.map((item) => {
                          const larguraTotal =
                            parseFloat(item.largura) + desperdicioConfig;
                          const m1Value =
                            ((parseFloat(item.sim) / 100) * larguraTotal) / 100;
                          const m2Value =
                            ((parseFloat(item.nao) / 100) * larguraTotal) / 100;
                          return (
                            <tr
                              key={item.id}
                              className="border-b border-warning"
                            >
                              <td className="text-center bg-info/30">
                                {formatNumber(m1Value)}
                              </td>
                              <td className="text-center bg-error/30">
                                {formatNumber(m2Value)}
                              </td>
                              <td className="text-center bg-success/30">
                                {item.nome}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default PlotterTotals;
