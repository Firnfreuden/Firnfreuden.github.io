/* Projekt Firnfreuden */

// Innsbruck
let ibk = {
    lat: 47.267222,
    lng: 11.392778
};

// Karte initialisieren
let map = L.map("map", {
    fullscreenControl: true
}).setView([ibk.lat, ibk.lng], 9);



// thematische Layer
let themaLayer = {
    stations: L.featureGroup(),
    wind: L.featureGroup(),
    route: L.featureGroup(),
    temperature: L.featureGroup(),
    schnee: L.featureGroup(),
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
    }).addTo(map),
    "eGrundkarte Tirol Winter": L.layerGroup([
        eGrundkarteTirol.winter,
        eGrundkarteTirol.nomenklatur
    ]),
    "eGrundkarte Tirol Orthofoto": L.layerGroup([
        eGrundkarteTirol.ortho,
        eGrundkarteTirol.nomenklatur,
    ])
}, {
    "Wetterstationen": themaLayer.stations,
    "Temperatur [°C]": themaLayer.temperature,
    "Wind [km/h]": themaLayer.wind,
    "Schneehöhe [cm]": themaLayer.schnee,
    "GPX-Route": themaLayer.route
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
    theme: "bike-tirol",
}).addTo(map);
controlElevation.load("data/etappe27.gpx");


// Adding MiniMap
let osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
let osmAttrib = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
let osm2 = new L.TileLayer(osmUrl, { minZoom: 0, maxZoom: 13, attribution: osmAttrib });
let miniMap = new L.Control.MiniMap(osm2, { toggleDisplay: true }).addTo(map);

/////


//funktion farben
function getColor(value, ramp) {
    //console.log("getColor: value: ", value, "ramp:", ramp);
    for (let rule of ramp) {
        //console.log("Rule:", rule);
        if (value >= rule.min && value < rule.max) {
            return rule.color;
        }
    }
}


//funktion TEMPERATUR definieren
function showTemperature(geojson) {
    L.geoJSON(geojson, {
        filter: function (feature) {
            //feature.properties.LT
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
            //feature.properties.WG
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
            //feature.properties.HS
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