import Plotly from "plotly.js/dist/plotly-scatter.min.js";
import createPlotlyComponent from "react-plotly.js/factory";
import { Data, Layout } from "plotly.js";

function ScatterPlot({
  plotData,
  isBinding,
}: {
  plotData: number[][];
  isBinding: boolean;
}): JSX.Element {
  const Plot = createPlotlyComponent(Plotly);
  let xData: number[] = [];
  let yData: number[] = [];

  plotData.forEach((row) => {
    xData.push(row[0]);
    yData.push(row[1]);
  });

  const trace: Data[] = [
    {
      x: xData,
      y: yData,
      mode: "lines",
      type: "scatter",
      marker: { color: "teal" },
    },
  ];

  let layout: Partial<Layout> = {
    xaxis: { title: { text: "Energy (eV)" } },
    yaxis: { title: { text: "Intensity (a.u.)" } },
    font: { size: 14 },
    autosize: false,
    width: 600,
    height: 450,
    margin: {
      l: 65,
      r: 50,
      b: 65,
      t: 90,
    },
  };

  if (isBinding) {
    layout = {
      ...layout,
      xaxis: { title: { text: "Energy (eV)" }, autorange: "reversed" },
    };
  }

  return (
    <Plot
      data={trace}
      config={{ responsive: true, displayModeBar: true }}
      layout={layout}
    />
  );
}

export default ScatterPlot;
