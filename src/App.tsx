import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import ScatterPlot from "./Plot";

interface Config {
  angleMin: number;
  angleMax: number;
  fermiEnergy: number;
  isBinding: boolean;
}

function App(): JSX.Element {
  const [filename, setFilename] = useState("");
  const [content, setContent] = useState<string[]>([]);
  const [data, setData] = useState<number[][]>([]);
  const [angle, setAngle] = useState<number[]>([]);
  const [status, setStatus] = useState<string[]>([]);
  const [showCopied, setShowCopied] = useState(false);
  const [isKinetic, setIsKinetic] = useState(false);
  const [config, setConfig] = useState<Config>({
    angleMin: 0.0,
    angleMax: 0.0,
    fermiEnergy: 1482.0,
    isBinding: false,
  });
  const [isLoading, setLoading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      setFilename(file.name);
      setLoading(true);
      setStatus([]);

      const reader = new FileReader();
      reader.readAsText(file);
      let content: string[];

      reader.onload = async () => {
        const text = reader.result?.toString();

        if (text !== undefined) {
          content = splitByLineBreaks(text);
        } else {
          let t = tNow();
          setStatus([
            `${t} ❌ Oops! Something went wrong while reading file content.`,
          ]);
          console.log("Oops! Something went wrong while reading file content.");
        }

        setContent(content);
        setData([]);
        setLoading(false);

        let t = tNow();
        setStatus([`${t} ✔️ New file '${file.name}' selected.`]);

        let isKineticEnergy = false;

        for (let ii = 0; ii < content.length; ii++) {
          if (content[ii].split("=")[0].trim() === "Dimension 1 name") {
            if (content[ii].split("=")[1].trim() === "Kinetic Energy [eV]") {
              setIsKinetic(true);
              isKineticEnergy = true;
            } else {
              setIsKinetic(false);
            }
            break;
          } else {
            setIsKinetic(false);
          }
        }

        for (let ii = 0; ii < content.length; ii++) {
          if (content[ii].split("=")[0].trim() === "Dimension 2 scale") {
            let angle = splitByWhiteSpaces(content[ii].split("=")[1]);
            angle = angle.filter((x) => x);
            let angleNum = angle.map((value) => parseFloat(value));

            setAngle(angleNum);
            setConfig({
              angleMin: angleNum[0],
              angleMax: angleNum[angleNum.length - 1],
              fermiEnergy: 1482,
              isBinding: false,
            });
            break;
          } else {
            setAngle([]);
            setConfig({
              angleMin: 0.0,
              angleMax: 0.0,
              fermiEnergy: 1482,
              isBinding: isKineticEnergy,
            });
          }
        }
      };
    });
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop, maxFiles: 1 });

  const ProcessData = () => {
    if (!filename) {
      let t = tNow();
      setStatus([...status, `${t} ❌ Did you select a data file?`]);
      return;
    }

    let energy = [];
    let intensity = [];
    let energyDimSize = 0;
    let angleDimSize = 0;
    let data = [];
    let dataStart = 0;

    for (let ii = 0; ii < content.length; ii++) {
      if (content[ii].split("=")[0].trim() === "Dimension 1 size") {
        energyDimSize = parseInt(content[ii].split("=")[1]);
        // console.log("Dimension 1 size: ", energyDimSize);
      }

      if (content[ii].split("=")[0].trim() === "Dimension 2 size") {
        angleDimSize = parseInt(content[ii].split("=")[1]);
        // console.log("Dimension 2 size: ", angleDimSize);
      }

      if (/^\[Data\s\d+\]$/.test(content[ii].trim())) {
        dataStart = ii + 1;
        break;
      }
    }

    let angleStart = 0;
    let angleEnd = angle.length - 1;
    let yMin = config.angleMin;
    let yMax = config.angleMax;

    if (yMin !== angle[0]) {
      let closestPoint = angle.map((value) => Math.abs(value - yMin));
      angleStart = closestPoint.indexOf(Math.min(...closestPoint));
    }

    if (yMax !== angle[angle.length - 1]) {
      let closestPoint = angle.map((value) => Math.abs(value - yMax));
      angleEnd = closestPoint.indexOf(Math.min(...closestPoint));
    }

    for (let ii = dataStart; ii < dataStart + energyDimSize; ii++) {
      let temp: string[] = [];
      let tempEnergy = 0;
      let tempIntensity = 0;

      temp = splitByWhiteSpaces(content[ii]);
      temp = temp.filter((x) => x);

      let tempEnergyStr = temp.shift();
      if (tempEnergyStr !== undefined) {
        tempEnergy = parseFloat(tempEnergyStr);
      } else {
        let t = tNow();
        setStatus([
          ...status,
          `${t} ❌ Error occur while parsing energy values.`,
        ]);
        console.log("Error occur while parsing energy values.");
      }

      if (config.isBinding) {
        tempEnergy = config.fermiEnergy - tempEnergy;
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

    if (data.length === 0) {
      let t = tNow();
      setStatus([...status, `${t} ❌ No data found!`]);
      // console.log("No data found!");
    } else {
      setData(data);
      let t = tNow();
      setStatus([...status, `${t} ✔️ Line profile created.`]);
    }
  };

  const DownloadPlaintext = () => {
    let outFilename = "";
    if (
      filename.slice(filename.length - 4, filename.length).toLowerCase() ===
      ".txt"
    ) {
      outFilename = filename.slice(0, filename.length - 4) + ".x_y";
    } else {
      outFilename = filename + ".x_y";
    }

    if (data.length > 0) {
      let downloadContent = "";

      for (let ii = 0; ii < data.length; ii++) {
        downloadContent = downloadContent.concat(
          `${data[ii][0]}\t${data[ii][1].toExponential()}\r\n`
        );
      }

      const element = document.createElement("a");
      const file = new Blob([downloadContent], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = outFilename;
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
          `${data[ii][0]}\t${data[ii][1].toExponential()}\r\n`
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

  const HandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const name = target.name;
    const value = target.type === "checkbox" ? target.checked : target.value;

    setConfig({ ...config, [name]: value });
    setData([]);
  };

  return (
    <div className="container">
      <div className="wrapper">
        <h3 style={{ color: "#15847b" }}>XPS Data Converter</h3>
        <hr />
        <br />
        <p>
          This app converts Scienta SES spectra (<code>.txt</code> format) into
          energy vs intensity two column format by integrating along the angular
          dimension, suitable for XPS data analysis.
        </p>

        <div {...getRootProps()}>
          <input {...getInputProps()} />
          {filename !== "" ? (
            <div className="dropzone">
              <p>
                Selected file: <b>{filename}</b>
                <br />
              </p>
              <p style={{ color: "grey", fontSize: "0.9em" }}>
                <i>
                  (If required, you can drop a new file in this box again, or
                  click to browse)
                </i>
              </p>
            </div>
          ) : (
            <div
              className="dropzone"
              style={{ paddingTop: "5em", paddingBottom: "5em" }}
            >
              <p>
                <b>Drop</b> your data file in this box, or <b>click</b> here to
                select.
              </p>
              <p style={{ color: "grey", fontSize: "0.9em" }}>
                <i>(Please drag & drop or select a single file at a time)</i>
              </p>
            </div>
          )}
        </div>

        {isLoading ? (
          <p style={{ color: "grey" }}>Please wait. Loading file content...</p>
        ) : (
          <>
            <form className="form">
              {angle.length > 0 && (
                <>
                  <p>Angular integration limits:</p>
                  <p>
                    θ<sub>min</sub> = &nbsp;
                    <input
                      type="text"
                      id="angleMin"
                      name="angleMin"
                      placeholder={(0.0).toString()}
                      value={config.angleMin}
                      onChange={HandleChange}
                      style={{ width: "120px" }}
                    />
                  </p>
                  <p>
                    θ<sub>max</sub> = &nbsp;
                    <input
                      type="text"
                      id="angleMax"
                      name="angleMax"
                      placeholder={(0.0).toString()}
                      value={config.angleMax}
                      onChange={HandleChange}
                      style={{ width: "120px" }}
                    />
                  </p>
                </>
              )}

              {isKinetic && (
                <p>
                  <input
                    type="checkbox"
                    style={{ width: "25px" }}
                    id="isBinding"
                    name="isBinding"
                    checked={config.isBinding}
                    onChange={HandleChange}
                  />
                  Convert to binding energy (E<sub>bin</sub> = E<sub>F</sub> - E
                  <sub>kin</sub>)
                </p>
              )}

              {config.isBinding && (
                <p>
                  Fermi energy (hν - W<sub>φ</sub>) =&nbsp;
                  <input
                    type="text"
                    id="fermiEnergy"
                    name="fermiEnergy"
                    placeholder={(1482.0).toString()}
                    value={config.fermiEnergy}
                    onChange={HandleChange}
                  />
                </p>
              )}
            </form>

            {content.length > 0 && data.length === 0 && (
              <button onClick={ProcessData} className="btn">
                Create Line Profile
              </button>
            )}

            {data.length > 0 && (
              <>
                <button className="btn" onClick={DownloadPlaintext}>
                  Save
                </button>
                <button className="btn" onClick={CopyToClipboard}>
                  {showCopied ? "Copied" : "Copy"}
                </button>
              </>
            )}

            <br />
            <br />

            {status.length > 0 && (
              <>
                {status.map((item, key) => (
                  <p key={key}>{item}</p>
                ))}
              </>
            )}

            {data.length > 0 && (
              <>
                <ScatterPlot plotData={data} isBinding={config.isBinding} />
                <br />
                <br />
                <table>
                  <tbody>
                    <tr>
                      <th>Energy (eV)</th>
                      <th>Intensity (a.u.)</th>
                    </tr>
                    {data.map((value, key) => (
                      <tr key={key}>
                        <td>
                          <code>{value[0]}</code>
                        </td>
                        <td>
                          <code>{value[1].toExponential()}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            <br />
            <br />
          </>
        )}
      </div>
      <footer>
        Built and maintained by{" "}
        <a href="https://github.com/pranabdas/xps">Pranab Das</a>.
      </footer>
    </div>
  );
}

const tNow = () => {
  const tNow = new Date();
  let hours = tNow.getHours();
  let hrsStr: string;
  if (hours === 0) {
    hrsStr = "00:";
  } else if (hours < 10) {
    hrsStr = `0${hours}:`;
  } else {
    hrsStr = `${hours}:`;
  }

  let minutes = tNow.getMinutes();
  let minStr: string;
  if (minutes === 0) {
    minStr = "00:";
  } else if (minutes < 10) {
    minStr = `0${minutes}:`;
  } else {
    minStr = `${minutes}:`;
  }

  let seconds = tNow.getSeconds();
  let secStr: string;
  if (seconds === 0) {
    secStr = "00";
  } else if (seconds < 10) {
    secStr = `0${seconds}`;
  } else {
    secStr = `${seconds}`;
  }

  return hrsStr + minStr + secStr;
};

const splitByLineBreaks = (content: string) => {
  return content
    .replace(/\r/g, "\n") // convert carriage return `\r` to `\n`
    .replace(/[\n]+/g, "\n") // replace multiple consecutive `\n` by single `\n`
    .replace(/^\n/, "") // remove any new line character in the beginning
    .replace(/\n$/, "") // trim any new line character at the end
    .split("\n");
};

const splitByWhiteSpaces = (line: string) => {
  return line
    .replace(/\t/g, " ") // replace tab character by space
    .replace(/[\s]+/g, " ") // replace multiple space characters by single one
    .trim() // trim any beginning or trailing spaces
    .split(/\s/);
};

export default App;
