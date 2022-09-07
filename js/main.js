//Name: Robert Madill
//Email: madillro@sheridancollege.ca
//Date: 2022-07-01
//Description: This is the javascript page for our second assignment in Mobile Web Development.
//This page helps us to load the data from the JSON file and display it on the page.

//global variables
let go = {}; //empty object to store vars

//main entry point
document.addEventListener("DOMContentLoaded", () => {
    //1. init DOM elements
    let comboProv = document.getElementById("comboProv");
    comboProv.selectedIndex = 0;
    comboProv.addEventListener("change", () => { changeProvince(comboProv.value), provinceTable(comboProv.value) });

    //2. load & process JSON
    //below is the json used to parse the data
    //const URL = "http://ejd.songho.ca/ios/covid19.json";
    const URL = "assets/covid19-2022-august-20.json";
    fetch(URL)
        .then((respone) => respone.json())
        .then((json) => parseJSON(json))
        .catch((error) => console.log(error.message));

    //3. set source of data
    let source = document.getElementById("sourceData");
    let srcUrl = "https://health-infobase.canada.ca";
    source.innerHTML = ("Source: " + srcUrl).italics();
});

// process JSON data
function parseJSON(json) {
    // 1. remember the original JSON, so reference it later
    go.json = json;

    // 2. calculate # of weeks
    const MS_PER_WEEK = 1000 * 60 * 60 * 24 * 7;
    let firstDate = new Date(go.json[0].date).getTime();
    let lastDate = new Date(go.json[go.json.length - 1].date).getTime();

    // 3. generate weeks array
    go.weeks = [];
    for (let i = firstDate; i <= lastDate; i += MS_PER_WEEK) {
        // generate ISO date string from ms, yyyy-MM-dd
        let dateString = new Date(i).toISOString().substring(0, 10);
        // put it into the weeks array
        go.weeks.push(dateString);
    }

    // 4. set the current week index to the latest week
    go.weekNum = document.getElementById("weekNum");
    go.weekNum.innerHTML = "Week: " + go.weeks[go.weeks.length - 1];
    go.weekIndex = go.weeks.length - 1;

    // 5. change province to the default
    changeProvince("Canada");
}

//change the province
function changeProvince(province) {
    let weekly = document.getElementById("weekly");
    let total = document.getElementById("total");

    //1. get the provinical data (optimization)
    go.json.forEach(data => {
        if (data.prname == province) {
            weekly.innerHTML = "<br>" + data.numtotal_last7.toLocaleString('en-US');
            total.innerHTML = "<br>" + data.totalcases.toLocaleString('en-US');
        }
    });

    //2. update the confimed cases
    let leftArrow = document.getElementById("arrLeft");
    leftArrow.addEventListener("click", () => {
        --go.weekIndex;
        if (go.weekIndex < 0) {
            go.weekIndex = 0;
        }
        let weeklyProvCases = go.weeks[go.weekIndex];
        go.weekNum.innerHTML = "Week: " + weeklyProvCases;
        go.json.forEach(data => {
            if (data.date == weeklyProvCases && data.prname == province) {
                weekly.innerHTML = "<br>" + data.numtotal_last7.toLocaleString('en-US');
                total.innerHTML = "<br>" + data.totalcases.toLocaleString('en-US');
            }
        });
    });

    let rightArrow = document.getElementById("arrRight");
    rightArrow.addEventListener("click", () => {
        ++go.weekIndex;
        if (go.weekIndex >= go.weeks.length) {
            go.weekIndex = go.weeks.length - 1;
        }
        let weeklyProvCases = go.weeks[go.weekIndex];
        go.weekNum.innerHTML = "Week: " + weeklyProvCases;
        go.json.forEach(data => {
            if (data.date == weeklyProvCases && data.prname == province) {
                weekly.innerHTML = "<br>" + data.numtotal_last7.toLocaleString('en-US');
                total.innerHTML = "<br>" + data.totalcases.toLocaleString('en-US');
            }
        });
    });

    //3. generate the weekly confirmed case values array
    go.provData = go.json.filter(data => data.prname === province);
    go.confirmedCasesValues = [];
    go.provData.forEach((data, index) => {
        if (data) {
            go.confirmedCasesValues[index] = data.numtotal_last7;
        } else {
            go.confirmedCasesValues[index] = 0;
        }
    });

    //4. generate the weekly deaths values array
    go.deathValues = [];
    go.provData.forEach((data, index) => {
        if (data) {
            go.deathValues[index] = data.numdeaths_last7;
        } else {
            go.deathValues[index] = 0;
        }
    });

    //5. draw the confirm/death graph
    drawConfirmGraph(go.weeks, go.confirmedCasesValues);
    drawDeathGraph(go.weeks, go.deathValues);

    //5. populate table for province
    provinceTable(province);
}

//populate the province table
function provinceTable(province) {
    let html = "";
    let tbody = document.getElementById("tableBody");
    //create copy of the JSON data to reverse for table
    go.json.reverseData = go.json.slice().reverse();

    go.json.reverseData.forEach(data => {
        if (data.prname === province) {
            html += "<tr><td>" + data.date +
                "</td><td>" + data.numtotal_last7.toLocaleString('en-US') +
                "</td><td>" + data.totalcases.toLocaleString('en-US') +
                "</td><td>" + data.numdeaths_last7.toLocaleString('en-US') +
                "</td><td>" + data.numdeaths.toLocaleString('en-US') +
                "</td></tr>";
        }
    });

    tbody.innerHTML = html;
}

//update confirmed cases
function drawConfirmGraph(xValues, yValues) {
    // NOTE: Must remove the previous chart if exists
    if (go.chart)
        go.chart.destroy();

    // get 2D rendering context(RC) from <canvas>
    let context = document.getElementById("chart").getContext("2d");

    // create new chart object with RC and chart options
    go.chart = new Chart(context,
        {
            type: "line",                    // type of chart
            data:
            {
                labels: xValues,            // labeles for x-axis
                datasets:
                    [{
                        data: yValues,          // y-values to plot
                        lineTension: 0,         // no Bezier curve
                        fill: true,             // fill background
                        fill: { target: "origin", above: "rgba(0, 136, 239 ,0.2)" },
                        borderColor: "rgba(0, 136, 239, 0.5)"  // line colour rgb(r,g,b), rgba(r,g,b,a), #rrggbb
                    }]
            },
            options:
            {
                maintainAspectRatio: false, // for responsive
                plugins:
                {
                    title:
                    {
                        display: true,
                        text: "Weekly Confirmed Cases"   // chart title
                    },
                    legend:
                    {
                        display: false
                    }
                }
            }
        });
}

//update death cases
function drawDeathGraph(xValues, yValues) {
    // NOTE: Must remove the previous chart if exists
    if (go.deathChart)
        go.deathChart.destroy();

    // get 2D rendering context(RC) from <canvas>
    let context = document.getElementById("deathChart").getContext("2d");

    // create new chart object with RC and chart options
    go.deathChart = new Chart(context,
        {
            type: "line",                    // type of chart
            data:
            {
                labels: xValues,            // labeles for x-axis
                datasets:
                    [{
                        data: yValues,          // y-values to plot
                        lineTension: 0,         // no Bezier curve
                        fill: true,             // fill background
                        fill: { target: "origin", above: "rgba(216, 170, 250, 0.2)" },
                        borderColor: "rgba(216, 170, 250, 0.5)"  // line colour rgb(r,g,b), rgba(r,g,b,a), #rrggbb
                    }]
            },
            options:
            {
                maintainAspectRatio: false, // for responsive
                plugins:
                {
                    title:
                    {
                        display: true,
                        text: "Weekly Deaths"   // chart title
                    },
                    legend:
                    {
                        display: false
                    }
                }
            }
        });
}