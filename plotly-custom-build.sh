# https://github.com/plotly/plotly.js/blob/master/CUSTOM_BUNDLE.md
CWD=${PWD}
npm i plotly.js react-plotly.js
cd node_modules/plotly.js
npm i
npm run custom-bundle -- --out scatter --traces scatter --transforms none
cd ${CWD}