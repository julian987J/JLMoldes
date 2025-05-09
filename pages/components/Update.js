import React, { useState, useEffect } from "react";

const Update = () => {
  const [seconds, setSeconds] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => (prev >= 5 ? 1 : prev + 1));
    }, 1000); // 1 segundo por incremento

    return () => clearInterval(interval);
  }, []);

  const progress = (seconds / 5) * 100; // Converte segundos em porcentagem para a barra

  return (
    <>
      <div
        className="radial-progress text-success text-xs"
        style={{ "--value": progress, "--size": "1.5rem" }}
        aria-valuenow={progress}
        role="progressbar"
      >
        {seconds}s
      </div>
    </>
  );
};

export default Update;
