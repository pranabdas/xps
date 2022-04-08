import { useState } from "react";

function App() {
  const [filename, setFilename] = useState("");
  const [content, setContent] = useState([]);
  const [data, setData] = useState([]);
  const [status, setStatus] = useState("");
  const [showCopied, setShowCopied] = useState(false);
  const [isKinetic, setIsKinetic] = useState(false);
  const [isBinding, setIsBinding] = useState(false);
  const [fermiEnergy, setFermiEnergy] = useState(1482);

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

      if (content[ii].trim() === "[Data 1]") {
        dataStart = ii + 1;
        break;
      }
    }

    for (let ii = dataStart; ii < dataStart + energyDimSize; ii++) {
      let temp = [],
        tempEnergy = 0,
        tempIntensity = 0;

      temp = content[ii].split(" ");
      temp = temp.filter((x) => x);
      tempEnergy = parseFloat(temp.shift());

      if (isBinding) {
        tempEnergy = fermiEnergy - tempEnergy;
      }

      for (let jj = 0; jj < temp.length; jj++) {
        if (!isNaN(parseFloat(temp[jj]))) {
          tempIntensity = tempIntensity + parseFloat(temp[jj]);
        } else {
          setStatus(status + "❌ NaN data point.\n");
          console.log("NaN data point.");
        }
      }

      if (temp.length !== angleDimSize) {
        setStatus(status + "❌ Angle dimension mismatch in data!\n");
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
      setStatus(status + "❌ Length of energy and intensity do not match!\n");
      console.log("Length of energy and intensity do not match!");
    }

    if (data.length < 1) {
      setStatus(status + "❌ No data found!\n");
      console.log("No data!");
    } else {
      setData(data);
      setStatus(status + "✔️ Conversion done\n");
    }
  };

  const DownloadPlaintext = () => {
    let outFilename = null;
    if (
      filename.slice(filename.length - 4, filename.length).toLowerCase() ===
      ".txt"
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
    } else {
      alert("❌ No data!");
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
      alert("❌ Empty data!");
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
      setStatus("✔️ File uploaded\n");

      for (let ii = 0; ii < content.length; ii++) {
        if (content[ii].split("=")[0] === "Dimension 1 name") {
          setIsKinetic(true);
          break;
        }
      }
    };
  };

  const HandleIsBinding = (e) => {
    setIsBinding(e.target.checked);
  };

  const HandleFermiEnergy = (e) => {
    setFermiEnergy(parseFloat(e.target.value));
  };

  return (
    <div className="container">
      <div className="wrapper">
        <h3 style={{ color: "#15847b" }}>XPS Data Converter</h3>
        <hr />
        <br />
        <p>
          This app converts Scienta SES spectra (<code>.txt</code> format) into
          energy vs intensity two column format, suitable for XPS data analysis.
        </p>
        <form className="form">
          <p>
            Select data file:&emsp;
            <input
              type="file"
              onChange={HandleUpload}
              style={{ width: "300px", cursor: "pointer" }}
              title="Select file"
            />
          </p>
          {isKinetic ? (
            <p>
              <input
                type="checkbox"
                style={{ width: "25px" }}
                id="isBinding"
                name="isBinding"
                checked={isBinding}
                onChange={HandleIsBinding}
              />
              Convert to binding energy (E<sub>bin</sub> = E<sub>F</sub> - E
              <sub>kin</sub>)
            </p>
          ) : null}

          {isBinding ? (
            <p>
              Fermi energy (hν - W<sub>φ</sub>):&nbsp;
              <input
                type="text"
                id="fermiEnergy"
                name="fermiEnergy"
                placeholder={fermiEnergy}
                value={fermiEnergy}
                onChange={HandleFermiEnergy}
              />
            </p>
          ) : null}
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
          <p style={{ whiteSpace: "pre-line" }}>
            {status}
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
        Built and maintained by{" "}
        <a href="https://github.com/pranabdas/xps">Pranab Das</a>.
      </footer>
    </div>
  );
}

export default App;
