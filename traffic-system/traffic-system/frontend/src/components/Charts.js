import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement);

function Charts() {

  const data = {
    labels: ["Jan", "Feb", "Mar"],
    datasets: [
      {
        label: "Violations",
        data: [10, 20, 15],
        backgroundColor: "blue"
      }
    ]
  };

  return (
    <div style={{ marginTop: "40px" }}>
      <h4>Monthly Violations</h4>
      <Bar data={data} />
    </div>
  );
}

export default Charts;