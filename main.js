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
}

// WMTS Hintergrundlayer der eGrundkarte Tirol
let eGrundkarteTirol = {
    sommer: L.tileLayer("https://wmts.kartetirol.at/gdi_summer/{z}/{x}/{y}.png", {
        attribution: `Datenquelle: <a href="https://www.data.gv.at/katalog/dataset/land-tirol_elektronischekartetirol">eGrundkarte Tirol</a>`
    }),
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
    "eGrundkarte Tirol Sommer": L.layerGroup([
        eGrundkarteTirol.sommer,
        eGrundkarteTirol.nomenklatur
    ]).addTo(map),
    "eGrundkarte Tirol Winter": L.layerGroup([
        eGrundkarteTirol.winter,
        eGrundkarteTirol.nomenklatur
    ]),
    "eGrundkarte Tirol Orthofoto": L.layerGroup([
        eGrundkarteTirol.ortho,
        eGrundkarteTirol.nomenklatur,
    ])
}, {
    "GPX-Route": themaLayer.route.addTo(map)
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
