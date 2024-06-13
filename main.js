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
    "Temperatur [°C]": themaLayer.temperature,
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

let pulldown = document.querySelector("#pulldown");

for (let etappe of ETAPPEN) {
    let status = "";
    if (etappe.nr == 27) {
        status = " selected ";
    }
    pulldown.innerHTML += `<option ${status} value="${etappe.user}">Etappe ${etappe.nr}: ${etappe.titel}</option>`;
}

pulldown.onchange = function (evt) {
    let username = evt.target.value;
    let url = `https://${username}.github.io/biketirol`;
    window.location.href = url;
}

// Adding MiniMap
let osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
let osmAttrib = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
let osm2 = new L.TileLayer(osmUrl, { minZoom: 0, maxZoom: 13, attribution: osmAttrib });
let miniMap = new L.Control.MiniMap(osm2, { toggleDisplay: true }).addTo(map);
