import { useState } from "react";

function tNow() {
  const tNow = new Date();
  let hours = tNow.getHours();
  if (hours === 0) {
    hours = "00:"
  }
  else if (hours < 10) {
    hours = `0${hours}:`;
  } else {
    hours = `${hours}:`;
  }

  let minutes = tNow.getMinutes();
  if (minutes === 0) {
    minutes = "00:"
  }
  else if (minutes < 10) {
    minutes = `0${minutes}:`;
  } else {
    minutes = `${minutes}:`;
  }

  let seconds = tNow.getSeconds();
  if (seconds === 0) {
    seconds = "00"
  }
  else if (seconds < 10) {
    seconds = `0${seconds}`;
  } else {
    seconds = `${seconds}`;
  }

  return hours + minutes + seconds;
}

function App() {
  const [filename, setFilename] = useState("");
  const [content, setContent] = useState([]);
  const [data, setData] = useState([]);
  const [angle, setAngle] = useState([]);
  const [status, setStatus] = useState([]);
  const [showCopied, setShowCopied] = useState(false);
  const [isKinetic, setIsKinetic] = useState(false);
  const [appState, setAppState] = useState({
    ymin: 0.0,
    ymax: 0.0,
    fermiEnergy: 1482,
    isBinding: false,
  });

  const ProcessData = () => {
    if (!filename) {
      let t = tNow();
      setStatus([...status, `${t} ❌ Did you select a data file?`]);
      return;
    }

    let energy = [],
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

      if (content[ii].trim() === "[Data 1]") {
        dataStart = ii + 1;
        break;
      }
    }

    let angleStart = 0,
      angleEnd = angle.length - 1,
      yMin = parseFloat(appState.ymin),
      yMax = parseFloat(appState.ymax);

    if (yMin !== angle[0]) {
      let closestPoint = angle.map((value) => Math.abs(value - yMin));
      angleStart = closestPoint.indexOf(Math.min(...closestPoint));
      // console.log(angleStart);
    }

    if (yMax !== angle[angle.length - 1]) {
      let closestPoint = angle.map((value) => Math.abs(value - yMax));
      angleEnd = closestPoint.indexOf(Math.min(...closestPoint));
      // console.log(angleEnd);
    }

    for (let ii = dataStart; ii < dataStart + energyDimSize; ii++) {
      let temp = [],
        tempEnergy = 0,
        tempIntensity = 0;

      temp = content[ii].split(" ");
      temp = temp.filter((x) => x);
      tempEnergy = parseFloat(temp.shift());

      if (appState.isBinding) {
        tempEnergy = parseFloat(appState.fermiEnergy) - tempEnergy;
      }

      for (let jj = angleStart; jj <= angleEnd; jj++) {
        if (!isNaN(parseFloat(temp[jj]))) {
          tempIntensity = tempIntensity + parseFloat(temp[jj]);
        } else {
          let t = tNow();
          setStatus([...status, `${t} ❌ NaN data point.`]);
          console.log("NaN data point.");
        }
      }

      if (temp.length !== angleDimSize) {
        let t = tNow();
        setStatus([...status, `${t} ❌ Angle dimension mismatch in data!`]);
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
      let t = tNow();
      setStatus([
        ...status,
        `${t} ❌ Length of energy and intensity do not match!`,
      ]);
      console.log("Length of energy and intensity do not match!");
    }

    if (data.length < 1) {
      let t = tNow();
      setStatus([...status, `${t} ❌ No data found!`]);
      console.log("No data found!");
    } else {
      setData(data);
      let t = tNow();
      setStatus([...status, `${t} ✔️ Conversion done.`]);
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
      let t = tNow();
      setStatus([...status, `${t} ❌ No data to save!`]);
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
      let t = tNow();
      setStatus([...status, `${t} ❌ No data! Empty clipboard.`]);
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
      let t = tNow();
      setStatus([...status, `${t} ✔️ New file selected.`]);

      for (let ii = 0; ii < content.length; ii++) {
        if (content[ii].trim() === "Dimension 1 name=Kinetic Energy [eV]") {
          setIsKinetic(true);
        }

        if (content[ii].split("=")[0] === "Dimension 2 scale") {
          let angle = content[ii].split("=")[1].split(" ");
          angle = angle.filter((x) => x);
          angle = angle.map((value) => parseFloat(value));

          setAngle(angle);
          setAppState({
            ...appState,
            ymin: angle[0],
            ymax: angle[angle.length - 1],
          });
          break;
        }
      }
    };
  };

  const HandleChange = (e) => {
    const target = e.target;
    const name = target.name;
    const value = target.type === "checkbox" ? target.checked : target.value;

    setAppState({ ...appState, [name]: value });
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
          {angle.length ? (
            <>
              <p>Angular integration limits:</p>
              <p>
                θ<sub>min</sub> = &nbsp;
                <input
                  type="text"
                  id="ymin"
                  name="ymin"
                  placeholder={0.0}
                  value={appState.ymin}
                  onChange={HandleChange}
                  style={{ width: "120px" }}
                />
              </p>
              <p>
                θ<sub>max</sub> = &nbsp;
                <input
                  type="text"
                  id="ymax"
                  name="ymax"
                  placeholder={0.0}
                  value={appState.ymax}
                  onChange={HandleChange}
                  style={{ width: "120px" }}
                />
              </p>
            </>
          ) : null}

          {isKinetic ? (
            <p>
              <input
                type="checkbox"
                style={{ width: "25px" }}
                id="isBinding"
                name="isBinding"
                checked={appState.isBinding}
                onChange={HandleChange}
              />
              Convert to binding energy (E<sub>bin</sub> = E<sub>F</sub> - E
              <sub>kin</sub>)
            </p>
          ) : null}

          {appState.isBinding ? (
            <p>
              Fermi energy (hν - W<sub>φ</sub>) =&nbsp;
              <input
                type="text"
                id="fermiEnergy"
                name="fermiEnergy"
                placeholder={1482.0}
                value={appState.fermiEnergy}
                onChange={HandleChange}
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
        {status.length ? (
          <>
            {status.map((item, key) => (
              <p key={key}>{item}</p>
            ))}
          </>
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
