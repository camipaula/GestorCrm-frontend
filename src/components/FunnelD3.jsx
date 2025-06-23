import { useEffect, useRef } from "react";
import D3Funnel from "d3-funnel";
import PropTypes from "prop-types";

const ordenFases = [
  "Nuevo",
  "En Planeación",
  "Cierre",
  "Reabierto",
  "Competencia",
];


const colores = [
  "#4caf50",  // Nuevo (verde)
  "#03a9f4",  // En Planeación (celeste)
  "#f44336",  // Cierre (rojo)
  "#fdd835",  // Reabierto (amarillo)
    "#f44336",  // Competencia (rojo)

];

const FunnelD3 = ({ data }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    containerRef.current.innerHTML = "";

    const dataOrdenada = [...data].sort(
      (a, b) => ordenFases.indexOf(a.estado) - ordenFases.indexOf(b.estado)
    );

    const funnelData = dataOrdenada.map((item) => [
  item.estado.toUpperCase(), // Solo el nombre de la fase
  item.cantidad,
]);


    const chart = new D3Funnel(containerRef.current);

    chart.draw(funnelData, {
      chart: {
        bottomWidth: 1 / 3,
        curve: { enabled: true },
        animate: 200,
        width: containerRef.current.offsetWidth,
        height: 300,
      },
      block: {
        dynamicHeight: true,
        minHeight: 15,
        fill: {
          scale: colores,
        },
      },
      label: {
  fontSize: "14px",
  color: "#000",
  format: (label) => label, // Solo muestra el texto original, o sea "NUEVO"
},

    });
  }, [data]);

  const dataOrdenada = [...data].sort(
    (a, b) => ordenFases.indexOf(a.estado) - ordenFases.indexOf(b.estado)
  );

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <h3>📌 FASES DE PROSPECCIÓN</h3>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          maxWidth: "350px",
          margin: "0 auto",
        }}
      ></div>

      {/* Leyenda */}
      <div style={{ marginTop: "10px" }}>
        {dataOrdenada.map((fase, idx) => (
          <div
            key={idx}
            style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: colores[ordenFases.indexOf(fase.estado)],
                marginRight: "8px",
                borderRadius: "2px",
              }}
            ></div>
            <span style={{ fontSize: "13px", color: "#333" }}>
              {fase.estado.toUpperCase()}: {fase.cantidad} ({fase.porcentaje}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

FunnelD3.propTypes = {
  data: PropTypes.array.isRequired,
};

export default FunnelD3;
