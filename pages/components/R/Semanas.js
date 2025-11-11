import React, { useEffect, useState, useMemo, useCallback } from "react";
import Execute from "models/functions";
import { useWebSocket } from "../../../contexts/WebSocketContext";
import { useAuth } from "../../../contexts/AuthContext";

const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff)).toISOString().split("T")[0];
};

const Semanas = ({ r }) => {
  const [semanalDados, setSemanalDados] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lastMessage } = useWebSocket();
  const { user } = useAuth();
  const isAdmin = user && user.role === "admin";

  const fetchData = useCallback(async () => {
    if (typeof r === "undefined" || r === null) return;
    setLoading(true);
    try {
      const data = await Execute.receiveFromSemanal(r);
      setSemanalDados(data);
    } catch (error) {
      console.error("Erro ao carregar dados semanais:", error);
    } finally {
      setLoading(false);
    }
  }, [r]);

  useEffect(() => {
    if (r) {
      fetchData();
    }
  }, [r, fetchData]);

  useEffect(() => {
    if (lastMessage && lastMessage.data) {
      const { type, payload } = lastMessage.data;
      if (
        type === "SEMANAL_NEW_ITEM" &&
        payload &&
        String(payload.r) === String(r)
      ) {
        setSemanalDados((prev) => [...prev, payload]);
      } else if (
        type === "SEMANAL_FINALIZED_ITEM" &&
        payload &&
        String(payload.r) === String(r)
      ) {
        fetchData();
      } else if (
        type === "SEMANAL_PERIOD_DELETED" &&
        payload &&
        String(payload.r) === String(r)
      ) {
        fetchData();
      }
    }
  }, [lastMessage, r, fetchData]);

  const handleDeletePeriod = async (periodKey) => {
    try {
      const response = await fetch("/api/v1/tables/semanal", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ r, periodKey }),
      });

      if (!response.ok) {
        throw new Error("Erro ao excluir período.");
      }
    } catch (error) {
      console.error("Erro ao excluir período:", error);
      alert("Falha ao excluir período.");
    }
  };

  const groupedByPeriod = useMemo(() => {
    const periods = semanalDados.reduce((acc, item) => {
      const periodKey = item.bobina || "null";
      if (!acc[periodKey]) {
        acc[periodKey] = [];
      }
      acc[periodKey].push(item);
      return acc;
    }, {});

    const calculatedPeriods = {};
    for (const periodKey in periods) {
      const periodData = periods[periodKey];
      const groupedByWeek = periodData.reduce((acc, item) => {
        const weekStart = getStartOfWeek(item.data);
        if (!acc[weekStart]) {
          acc[weekStart] = { pix: 0, real: 0 };
        }
        acc[weekStart].pix += Number(item.pix);
        acc[weekStart].real += Number(item.real);
        return acc;
      }, {});

      calculatedPeriods[periodKey] = Object.entries(groupedByWeek)
        .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
        .map(([week, totals]) => ({ week, ...totals }));
    }

    return calculatedPeriods;
  }, [semanalDados]);

  const sortedPeriodKeys = useMemo(() => {
    return Object.keys(groupedByPeriod).sort((a, b) => {
      if (a === "null") return -1;
      if (b === "null") return 1;
      return a.localeCompare(b);
    });
  }, [groupedByPeriod]);

  if (loading) {
    return <div className="text-center p-1">Carregando...</div>;
  }

  if (sortedPeriodKeys.length === 0) {
    return null;
  }

  return (
    <div>
      {sortedPeriodKeys.map((periodKey) => {
        const weeklyTotals = groupedByPeriod[periodKey];
        if (weeklyTotals.length === 0) return null;

        if (!isAdmin && periodKey !== "null") {
          return null;
        }

        return (
          <div
            key={periodKey}
            className="overflow-x-auto rounded-box border border-success bg-base-100 mt-1"
          >
            <h3 className="text-center font-bold p-1">
              {isAdmin && periodKey !== "null"
                ? `Bobina Fechada`
                : "Lançamentos Atuais"}
            </h3>
            <table className="table table-xs">
              <tbody>
                {isAdmin && (
                  <tr>
                    <th className="bg-primary/30 text-primary">Pix:</th>
                    {weeklyTotals.map((week, index) => (
                      <td
                        key={`pix-${periodKey}-${index}`}
                        className="text-center"
                      >
                        {week.pix.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                )}
                <tr>
                  <th className="bg-secondary/30 text-secondary">Real:</th>
                  {weeklyTotals.map((week, index) => (
                    <td
                      key={`real-${periodKey}-${index}`}
                      className="text-center"
                    >
                      {week.real.toFixed(2)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td colSpan={weeklyTotals.length + 1} className="bg-base-200">
                    <div className="flex items-center justify-between px-2">
                      <div className="text-center flex-1 text-lg font-bold">
                        {isAdmin && (
                          <>
                            <span className="text-primary mr-2">
                              {weeklyTotals
                                .reduce((sum, week) => sum + week.pix, 0)
                                .toFixed(2)}
                            </span>
                            <span className="text-base-content mx-2">|</span>
                          </>
                        )}
                        <span className="text-secondary ml-2">
                          {weeklyTotals
                            .reduce((sum, week) => sum + week.real, 0)
                            .toFixed(2)}
                        </span>
                      </div>
                      {isAdmin && (
                        <button
                          className="btn btn-xs btn-outline btn-error ml-2"
                          onClick={() => handleDeletePeriod(periodKey)}
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

export default Semanas;
