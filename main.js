/* Mutterberger See */

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
    forecast: L.featureGroup()
}

// WMTS Hintergrundlayer der eGrundkarte Tirol definieren
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
    }),
    
}

// Hintergrundlayer eGrundkarte Tirol mit GPX overlay
let layerControl = L.control.layers({
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
    "Zustiegsroute zum Photospot": themaLayer.route.addTo(map),
    "Vorhersage durch Klicken auf Karte": themaLayer.forecast.addTo(map)}).addTo(map);

// Maßstab
L.control.scale({
    imperial: false,
}).addTo(map);

// GPX Track visualisieren
let controlElevation = L.control.elevation({
    time: false,
    elevationDiv: "#profile",
    height: 300,
    theme: "zustieg"
}).addTo(map);
controlElevation.load("./data/winklmoos.gpx")


// Wettervorhersage MET Norway
async function showForecast(url, latlng) {
    let response = await fetch(url);
    let jsondata = await response.json();
    //console.log(jsondata, latlng);

    let current = jsondata.properties.timeseries[0].data.instant.details;
    //console.log(current);
    let timestamp =new Date(jsondata.properties.meta.updated_at).toLocaleString();
    let timeseries = jsondata.properties.timeseries;

    let markup = `
        <h4>Wetter für ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)} (${timestamp})</h4>
        <table>
            <tr><td>Luftdruck (hPa)</td><td>${current.air_pressure_at_sea_level}</td></tr>
            <tr><td>Lufttemperatur (°C)</td><td>${current.air_temperature}</td></tr>
            <tr><td>Bewölkungsgrad (%)</td><td>${current.cloud_area_fraction}</td></tr>
            <tr><td>Relative Luftfeuchtigkeit (%)</td><td>${current.relative_humidity}</td></tr>
            <tr><td>Windrichtung (°)</td><td>${current.wind_from_direction}</td></tr>
            <tr><td>Windgeschwindigkeit (m/s)</td><td>${current.wind_speed}</td></tr>
        </table>
    `;

    // Wettersymbole hinzufügen
    for (let i=0; i<=24; i+=3) {
        //console.log(timeseries[i]);
        let icon = timeseries[i].data.next_1_hours.summary.symbol_code;
        let image = `icons/${icon}.svg`;
        markup += `<img src="${image}" style="width:32px;" title="${timeseries[i].time.toLocaleString()}">`
        //console.log(icon, image);
    }

    L.popup().setLatLng(latlng).setContent(markup).openOn(themaLayer.forecast);

}

// auf Kartenklick reagieren
map.on("click", function(evt) {
    //console.log(evt.latlng.lat);
    let url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${evt.latlng.lat}&lon=${evt.latlng.lng}`;
    showForecast(url, evt.latlng);
});

// Klick auf Innsbruck simulieren
map.fireEvent("click", {
    latlng: L.latLng(ibk.lat, ibk.lng)
})
