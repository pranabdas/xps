import { useState } from "react";

function App() {
  const [filename, setFilename] = useState("");
  const [content, setContent] = useState([]);
  const [data, setData] = useState([]);
  const [status, setStatus] = useState("");
  const [showCopied, setShowCopied] = useState(false);

  const ProcessData = () => {
    let energy = [],
      // angle = [],
      intensity = [],
      energyDimSize = 0,
      angleDimSize = 0,
      data = [],
      dataStart = 0;

    for (let ii = 0; ii < content.length; ii++) {
      if (content[ii].split("=")[0] === "Dimension 1 size") {
        energyDimSize = parseInt(content[ii].split("=")[1]);
        // console.log("Dimension 1 size: ", energyDimSize);
      }

      if (content[ii].split("=")[0] === "Dimension 2 size") {
        angleDimSize = parseInt(content[ii].split("=")[1]);
        // console.log("Dimension 2 size: ", angleDimSize);
      }

      // if (content[ii].split("=")[0] === "Dimension 2 scale") {
      //   angle = content[ii].split("=")[1].split(" ");
      // }

      if (content[ii].split("]")[0] === "[Data 1") {
        dataStart = ii + 1;
      }
    }

    for (let ii = dataStart; ii < dataStart + energyDimSize; ii++) {
      let temp = [],
        tempEnergy = 0,
        tempIntensity = 0;

      temp = content[ii].split(" ");
      temp = temp.filter((x) => x);
      tempEnergy = parseFloat(temp.shift());

      for (let jj = 0; jj < temp.length; jj++) {
        if (!isNaN(parseFloat(temp[jj]))) {
          tempIntensity = tempIntensity + parseFloat(temp[jj]);
        } else {
          setStatus(status + "NaN data point.\n");
        }
      }

      if (temp.length !== angleDimSize) {
        setStatus(status + "Error: angle dimension mismatch in data!\n");
        console.log("Error: angle dimension mismatch in data!");
      }

      energy.push(tempEnergy);
      intensity.push(tempIntensity);
    }

    if (energy.length === intensity.length) {
      for (let ii = 0; ii < energy.length; ii++) {
        data.push([energy[ii], intensity[ii]]);
      }
    } else {
      setStatus(status + "Length of energy and intensity do not match!\n");
    }

    if (data.length < 1) {
      setStatus("No data!\n");
    }

    setData(data);
  };

  const DownloadPlaintext = () => {
    let outFilename = null;
    if (
      [".csv", ".dat", ".txt"].includes(
        filename.slice(filename.length - 4, filename.length).toLowerCase()
      )
    ) {
      outFilename = filename.slice(0, filename.length - 4);
    } else {
      outFilename = filename;
    }

    if (data.length) {
      let downloadContent = "";

      for (let ii = 0; ii < data.length; ii++) {
        downloadContent = downloadContent.concat(
          `${parseFloat(data[ii][0])}\t${parseFloat(
            data[ii][1]
          ).toExponential()}\r\n`
        );
      }

      const element = document.createElement("a");
      const file = new Blob([downloadContent], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = outFilename + ".x_y";
      document.body.appendChild(element); // Required for this to work in FireFox
      element.click();
    }
  };

  const CopyToClipboard = () => {
    if (data.length) {
      let clipboardContent = "";

      setTimeout(() => {
        setShowCopied(false);
      }, 1500);

      for (let ii = 0; ii < data.length; ii++) {
        clipboardContent = clipboardContent.concat(
          `${parseFloat(data[ii][0])}\t${parseFloat(
            data[ii][1]
          ).toExponential()}\r\n`
        );
      }
      navigator.clipboard.writeText(clipboardContent);
      setShowCopied(true);
    } else {
      navigator.clipboard.writeText("");
    }
  };

  const HandleUpload = (e) => {
    setFilename(e.target.files[0].name);
    const reader = new FileReader();
    reader.readAsText(e.target.files[0]);
    reader.onload = async (e) => {
      const text = e.target.result;
      const content = text.split("\n");
      setContent(content);
      setData([]);
      setStatus("");
    };
  };

  return (
    <div className="container">
      <div className="wrapper">
        <h3 style={{ color: "#15847b" }}>XPS App</h3>
        <hr />
        <br />
        <p>
          This app converts Scienta SES spectra (<code>.txt</code> format) into
          energy vs intensity two column format.
        </p>
        <form className="form">
          <p>
            Select data file:&emsp;
            <input
              type="file"
              onChange={HandleUpload}
              style={{ width: "300px", fontSize: "1em", cursor: "pointer" }}
              title="Select file"
            />
          </p>
        </form>
        <button onClick={ProcessData} className="btn">
          Convert
        </button>
        <button className="btn" onClick={DownloadPlaintext}>
          Save
        </button>
        <button className="btn" onClick={CopyToClipboard}>
          {showCopied ? "Copied" : "Copy"}
        </button>
        <br />
        <br />
        {status ? (
          <p>
            {status}
            <br />
            <br />
          </p>
        ) : null}
        {data.length ? (
          <table>
            <tbody>
              <tr>
                <th>Energy (eV)</th>
                <th>Intensity (a.u.)</th>
              </tr>
              {data.map((value, key) => (
                <tr key={key}>
                  <td>
                    <code>{parseFloat(value[0])}</code>
                  </td>
                  <td>
                    <code>{parseFloat(value[1]).toExponential()}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        <br />
        <br />
      </div>
      <footer>
        © Copyright {new Date().getFullYear().toString()}{" "}
        <a href="https://pranabdas.github.io/">Pranab Das</a>. All rights
        reserved.
      </footer>
    </div>
  );
}

export default App;
