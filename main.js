/* Projekt Firnfreuden */

// Innsbruck
let ibk = {
    lat: 47.267222,
    lng: 11.392778
};

// Karte initialisieren
let map = L.map("map", {
    fullscreenControl: true
}).setView([ibk.lat, ibk.lng], 5);



// thematische Layer
let themaLayer = {
    stations: L.featureGroup(),
    wind: L.featureGroup(),
    route: L.featureGroup(),
    temperature: L.featureGroup(),
    schnee: L.featureGroup(),
    forecast: L.featureGroup(),
}

// WMTS Hintergrundlayer der eGrundkarte Tirol
let eGrundkarteTirol = {
    winter: L.tileLayer(
        "https://wmts.kartetirol.at/gdi_winter/{z}/{x}/{y}.png", {
        attribution: `Datenquelle: <a href="https://www.data.gv.at/katalog/dataset/land-tirol_elektronischekartetirol">eGrundkarte Tirol</a>`
    }),
    ortho: L.tileLayer("https://wmts.kartetirol.at/gdi_ortho/{z}/{x}/{y}.png", {
        attribution: `Datenquelle: <a href="https://www.data.gv.at/katalog/dataset/land-tirol_elektronischekartetirol">eGrundkarte Tirol</a>`
    }
    ),
    nomenklatur: L.tileLayer("https://wmts.kartetirol.at/gdi_nomenklatur/{z}/{x}/{y}.png", {
        attribution: `Datenquelle: <a href="https://www.data.gv.at/katalog/dataset/land-tirol_elektronischekartetirol">eGrundkarte Tirol</a>`,
        pane: "overlayPane",
    })
}

// Hintergrundlayer eGrundkarte Tirol mit GPX-Route overlay
L.control.layers({
    "Relief avalanche.report": L.tileLayer(
        "https://static.avalanche.report/tms/{z}/{x}/{y}.webp", {
        attribution: `© <a href="https://sonny.4lima.de">Sonny</a>, <a href="https://www.eea.europa.eu/en/datahub/datahubitem-view/d08852bc-7b5f-4835-a776-08362e2fbf4b">EU-DEM</a>, <a href="https://lawinen.report/">avalanche.report</a>, all licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>`
    }),
    "eGrundkarte Tirol Winter": L.layerGroup([
        eGrundkarteTirol.winter,
        eGrundkarteTirol.nomenklatur
    ]).addTo(map),
    "eGrundkarte Tirol Orthofoto": L.layerGroup([
        eGrundkarteTirol.ortho,
        eGrundkarteTirol.nomenklatur,
    ])
}, {
    "Wetterstationen": themaLayer.stations,
    "Temperatur [°C]": themaLayer.temperature,
    "Wind [km/h]": themaLayer.wind,
    "Schneehöhe [cm]": themaLayer.schnee,
    "GPX-Route": themaLayer.route,
    "Wettervorhersage MET Norway": themaLayer.forecast,
    "ECMWF Windvorhersage": themaLayer.wind,
}).addTo(map);

// Change default options
L.control.rainviewer({
    position: 'bottomleft',
    nextButtonText: '>',
    playStopButtonText: 'Play/Stop',
    prevButtonText: '<',
    positionSliderLabelText: "Hour:",
    opacitySliderLabelText: "Opacity:",
    animationInterval: 500,
    opacity: 0.5
}).addTo(map);

// Maßstab
L.control.scale({
    imperial: false,
}).addTo(map);

let controlElevation = L.control.elevation({
    time: false,
    elevationDiv: "#profile",
    height: 200,
    theme: "skitouren",
}).addTo(map);
controlElevation.load("Skitouren Beschreibungen/gpx/glockturm.gpx", "Skitouren Beschreibungen/gpx/liebener_spitze.gpx");

// Wettervorhersage MET Norway
async function showForecast(url) {
    let response = await fetch(url);
    let jsondata = await response.json();

    // aktuelles Wetter und Wettervorhersage implementieren
    console.log(jsondata);
    L.geoJSON(jsondata, {
        pointToLayer: function (feature, latlng) {
            let details = feature.properties.timeseries[0].data.instant.details;
            let time = new Date(feature.properties.timeseries[0].time);


            let content = `
            <h4>Wettervorhersage für ${time.toLocaleString()} </h4>
            <ul>
                <li> Luftdruck (hPa): ${details.air_pressure_at_sea_level}</li>
                <li> Lufttemperatur (°C): ${details.air_temperature}</li>
                <li> Bewölkungsgrad (%): ${details.cloud_area_fraction} </li>
                <li> Luftfeuchtigkeit (%): ${details.relative_humidity}</li>
                <li> Windrichtung (°): ${details.wind_from_direction}</li>
                <li> Windgeschwindigkeit (km/h): ${Math.round(details.wind_speed * 3.6)}</li>
            </ul>
            `;

            for (let i = 0; i <= 24; i += 3) {
                let symbol = feature.properties.timeseries[i].data.next_1_hours.summary.symbol_code;
                let time = new Date(feature.properties.timeseries[i].time);
                content += `<img src="icons/${symbol}.svg" alt="${symbol}" style="width:32px" title="${time.toLocaleString()}">`;
            }

            //link zum Datendownload
            content += `
            <p><a href="${url}" target="met.no">Daten zum downloaden</a></p>
            `;
            L.popup(latlng, {
                content: content
            }).openOn(themaLayer.forecast);
        }
    }).addTo(themaLayer.forecast);
}
//showForecast("https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=47.267222&lon=11.392778");

// auf Kartenklick reagieren
map.on("click", function (evt) {
    showForecast(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${evt.latlng.lat}&lon=${evt.latlng.lng}`);
})

// Funktion für Windkarte
async function loadWind(url) {
    const response = await fetch(url);
    const jsondata = await response.json();
    L.velocityLayer({
        data: jsondata,
        lineWidth: 2,
        displayOptions: {
            directionString: "Windrichtung",
            speedString: "Windgeschwindigkeit",
            speedUnit: "k/h",
            position: "bottomright",
            velocityType: "",
        }
    }).addTo(themaLayer.wind);


    //vorhersagezeitpunkt ermitteln
    let forecastDate = new Date(jsondata[0].header.refTime);
    forecastDate.setHours(forecastDate.getHours() + jsondata[0].header.forecastTime);

    document.querySelector("#forecast-date").innerHTML = `
    (<a href="${url}" target="met.no"> Stand${forecastDate.toLocaleString()}</a>)
    `;

}
loadWind("https://geographie.uibk.ac.at/data/ecmwf/data/wind-10u-10v-europe.json");


// Adding MiniMap
let osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
let osmAttrib = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
let osm2 = new L.TileLayer(osmUrl, { minZoom: 0, maxZoom: 13, attribution: osmAttrib });
let miniMap = new L.Control.MiniMap(osm2, { toggleDisplay: true }).addTo(map);



//funktion farben
function getColor(value, ramp) {
    for (let rule of ramp) {
        if (value >= rule.min && value < rule.max) {
            return rule.color;
        }
    }
}


//funktion TEMPERATUR definieren
function showTemperature(geojson) {
    L.geoJSON(geojson, {
        filter: function (feature) {
            if (feature.properties.LT > -50 && feature.properties.LT < 50) {
                return true;
            }
        },
        pointToLayer: function (feature, latlng) {
            let color = getColor(feature.properties.LT, COLORS.temperature);
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color:${color};">${feature.properties.LT.toFixed(1)}</span>`
                })
            })
        }
    }).addTo(themaLayer.temperature);
}

//funktion WIND definieren
function showWind(geojson) {
    L.geoJSON(geojson, {
        filter: function (feature) {
            if (feature.properties.WG > 0 && feature.properties.WG < 250) {
                return true;
            }
        },
        pointToLayer: function (feature, latlng) {
            let color = getColor(feature.properties.WG, COLORS.wind);
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon-wind",
                    html: `<span title= "${feature.properties.WG.toFixed(1)} km/h"><i style="transform:rotate(${feature.properties.WR}deg); color:${color}" class="fa-solid fa-circle-arrow-down"></i></span>`
                })
            })
        }
    }).addTo(themaLayer.wind);
}

//funktion SCHNEEHÖHE definieren
function showSnow(geojson) {
    L.geoJSON(geojson, {
        filter: function (feature) {
            if (feature.properties.HS > 0 && feature.properties.HS < 800) {
                return true;
            }
        },
        pointToLayer: function (feature, latlng) {
            let color = getColor(feature.properties.HS, COLORS.schnee);
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color:${color};">${feature.properties.HS.toFixed(1)}</span>`
                })
            })
        }
    }).addTo(themaLayer.schnee);
}

// GeoJSON der Wetterstationen laden
async function showStations(url) {
    let response = await fetch(url);
    let geojson = await response.json();

    // Wetterstationen mit Icons und Popups
    //console.log(geojson)
    L.geoJSON(geojson, {
        pointToLayer: function (feature, ibk) {
            return L.marker(ibk, {
                icon: L.icon({
                    iconUrl: "icons/wifi.png",
                    iconAnchor: [16, 37],
                    popupAnchor: [0, -37],
                })
            })
        },
        onEachFeature: function (feature, layer) {
            let pointInTime = new Date(feature.properties.date);
            //console.log(pointInTime);
            // console.log(feature);
            layer.bindPopup(`
             <h4> ${feature.properties.name} (${feature.geometry.coordinates[2]}m)</h4>
             <ul>
                <li> Lufttemperatur (°C): ${feature.properties.LT != undefined ? feature.properties.LT.toFixed(1) : "-"}</li>
                <li> Relative Luftfeuchtigkeit (%): ${feature.properties.RH != undefined ? feature.properties.RH.toFixed(0) : "-"}</li>
                <li> Windgeschwindigkeit (km/h): ${feature.properties.WG != undefined ? feature.properties.WG.toFixed(1) : "-"}</li>
                <li> Schneehöhe (cm): ${feature.properties.HS != undefined ? feature.properties.HS.toFixed(0) : "-"} </li>
             </ul>
             <p> ${pointInTime.toLocaleString()}</p> 
            `);
        }
    }).addTo(themaLayer.stations);

    showTemperature(geojson);
    showWind(geojson);
    showSnow(geojson);

}
showStations("https://static.avalanche.report/weather_stations/stations.geojson");