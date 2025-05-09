var map = L.map('map').setView([22.3193, 114.1694], 11);

// === 底图 ===
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

var imagery = L.tileLayer('https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/imagery/WGS84/{z}/{x}/{y}.png', {
  attribution: 'Map data © HKSAR LandsD',
  maxZoom: 19
});

var baseLayers = {
  "OpenStreetMap": osm,
  "Imagery Map": imagery
};

// === 通用 popup 函数 ===
function popupGeneric(feature, layer) {
  var p = feature.properties;
  var title = p.Attraction || p.FACILITY_NAME_EN || p.addr_eng || p.Route_en || 'No name';
  var desc = p.Description || p.FACILITY_NAME_TC || p.addr_tc || p.Route_ch || '';
  layer.bindPopup('<strong>' + title + '</strong><br>' + desc);
}



/*
=========================================================================================
==== GeoJSON layer (AJAX request to the same server - localhost)
==== Data source: CSDI, Hong Kong
-----------------------------------------------------------------------------------------
*/

/* 1. === 行政区划图层 === */
let selectedDistrict;

var layer_district = new L.GeoJSON.AJAX('./files-geojson/csdi_district_4326.json', {
  style: {
    color: "#6495ED",
    weight: 2,
    fillOpacity: 0.3
  },
  onEachFeature: function (feature, layer) {
    const props = feature.properties;

    layer.bindTooltip(props.NAME_EN || props.NAME_TC, { sticky: true });

    layer.on('click', function () {
      if (selectedDistrict && selectedDistrict !== layer) {
        layer_district.resetStyle(selectedDistrict);
      }

      layer.setStyle({
        weight: 3,
        color: '#1e3a8a',
        fillOpacity: 0.6
      });

      selectedDistrict = layer;

      const infoText = `📍 <strong>${props.NAME_EN}</strong> | <strong>${props.NAME_TC}</strong> 
      | Area: ${parseFloat(props.SHAPE_Area).toFixed(2)} sq units`;

      document.getElementById('district-info-box').innerHTML = infoText;
    });
  }
})





/* 2. 景点attraction图层 */ 
var layer_geodatastore = new L.GeoJSON.AJAX('./files-geojson/geodatastore.json', {
  onEachFeature: function (feature, layer) {
    layer.on('click', function () {
      const props = feature.properties;

      const popupContent = `
        <strong>${props.Attraction} 🏞️</strong><br>
        <em>${props.Address}</em>
      `;
      L.popup()
        .setLatLng(layer.getLatLng())
        .setContent(popupContent)
        .openOn(map);

      const cardContent = `
        <h4>${props.Attraction} 🏞️</h4>
        <p><strong>📍 Address:</strong><br>${props.Address}</p>
        <p><strong>📖 Description:</strong><br>${props.Description}</p>
        ${props.Telephone_number && props.Telephone_number !== '-' 
          ? `<p><strong>📞 Tel:</strong><br>${props.Telephone_number}</p>` : ''
        }
        <p><a href="${props.Website}" target="_blank">🔗 More Info</a></p>
      `;
      document.getElementById('attraction-info-box').innerHTML = cardContent;

      map.setView(layer.getLatLng(), 15);
    });
  },
  pointToLayer: function (feature, latlng) {
    return L.marker(latlng, {
      icon: L.divIcon({
        className: 'emoji-icon',
        html: '🏞️',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
    });
  }
});




/* 3.campsite图层 */
var layer_campsite = new L.GeoJSON.AJAX('./files-geojson/Campsite_new.geojson', {
  pointToLayer: function (feature, latlng) {
    return L.marker(latlng, {
      icon: L.divIcon({
        className: 'emoji-icon',
        html: '⛺',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
    });
  },
  onEachFeature: function (feature, layer) {
    layer.on('click', function () {
      const props = feature.properties;
      const popupContent = `
        <strong>${props.FACILITY_NAME_EN} ⛺</strong><br>
        <em>${props.COUNTRY_PARK_EN}</em>
      `;
      L.popup()
        .setLatLng(layer.getLatLng())
        .setContent(popupContent)
        .openOn(map);

      const infoBox = document.getElementById('attraction-info-box');
      const htmlContent = `
        <h2 style="margin-top: 0; font-weight: bold; color: rgb(3, 67, 31); font-size: 18px;">
          ${props.FACILITY_NAME_TC}
          <span style="color: rgb(3, 67, 31); font-size: 18px; font-weight: normal;">${props.FACILITY_NAME_EN}</span>
        </h2>

        <p style="margin: 10px 0;">
          <strong>🌲Subordinate Country Parks:</strong><br>
          ${props.COUNTRY_PARK_EN}<span style="color: #777;"> &nbsp ${props.COUNTRY_PARK_TC}</span>
        </p>

        <p style="margin: 10px 0;">
          <strong>💧Source of Water:</strong><br>
          ${props.SOURCE_OF_WATER_EN}<span style="color: #777;"> &nbsp ${props.SOURCE_OF_WATER_TC}</span>
        </p>

        <p style="margin: 10px 0;">
          <strong>⛺Tent Space:</strong><br>
          ${props.TENT_SPACE_EN}<span style="color: #777;"> &nbsp ${props.TENT_SPACE_TC}</span>
        </p>
      `;
      infoBox.innerHTML = htmlContent;
    });
  }
});




/* 4. 郊野公園路线图层 */
function filterByDifficulty(target) {
  layer_geopark.eachLayer(layer => {
    const diff = simplifyDifficulty(layer.feature.properties.Diff_e || '');
    if (target === 'All' || diff === target) {
      layer.setStyle({ opacity: 1, fillOpacity: 0.7 });
      layer.addTo(map);
    } else {
      map.removeLayer(layer);
    }
  });
}

function simplifyDifficulty(value) {
  if (/^I\b/.test(value)) return 'Easy';
  if (/II|III/.test(value)) return 'Moderate';
  if (/IV|V/.test(value)) return 'Hard';
  return 'Unknown';
}


var layer_geopark = new L.GeoJSON.AJAX('./files-geojson/Geopark_routes.geojson', {
  style: function (feature) {
    const difficulty = simplifyDifficulty(feature.properties.Diff_e || '');
    const color = difficulty === 'Easy' ? '#1E90FF' :
                  difficulty === 'Moderate' ? '#DA70D6' :
                  difficulty === 'Hard' ? '#DC143C' : '#444444';
    return {
      color: color,
      weight: 5,              // 加粗路线
      opacity: 1,
      lineCap: 'round'
    };
  },
  onEachFeature: function (feature, layer) {
    const props = feature.properties;
    const difficulty = simplifyDifficulty(props.Diff_e || '');
  
    // 生成图片文件名（统一格式）
    function routeNameToFilename(name) {
      return name.trim()
                 .replace(/[^\w\s]/g, '')      // 移除特殊字符
                 .replace(/\s+/g, '_')         // 空格转下划线
                 + '.jpg';
    }
  
    const imageFilename = routeNameToFilename(props.Route_en || 'default');
    const imagePath = `./images/geopark_trails/${imageFilename}`;
  
    const popupContent = `
      <strong>${props.Route_en} 🧭</strong><br>
      <em>${difficulty} | ${props.Dist_en} | ${props.Visit_T_e}</em>
    `;
    layer.bindPopup(popupContent);

    layer.on('click', function () {
      const cardContent = `
        <div class="trail-card">
          <div class="trail-image">
            <img src="${imagePath}" alt="${props.Route_en}" onerror="this.src='./images/default_trail.jpg'">
          </div>
          <div class="trail-details">
            <h4>🥾${props.Route_en}</h4>
            <p><strong>🗺️ 中文名稱:</strong> ${props.Route_ch}</p>
            <p><strong>📏 Distance:</strong> ${props.Dist_en}</p>
            <p><strong>⏱️ Time Needed:</strong> ${props.Visit_T_e}</p>
            <p><strong>📉 Difficulty:</strong> ${difficulty} (${props.Diff_e})</p>
            <p><strong>📐 Route Length:</strong> ${Math.round(props.Shape_Length)} m</p>
          </div>
        </div>
      `;
      document.getElementById('trail-info-box').innerHTML = cardContent;
      map.fitBounds(layer.getBounds(), { maxZoom: 15 });
      // 显示图例
      document.querySelector('.map-legend').style.display = 'block';
    });
  }
})

  

// === 图层控制器 ===
var overlayLayers = {
  "📍 Districts": layer_district,
  "🏞️ Attractions": layer_geodatastore,
  "⛺ Campsites": layer_campsite,
  "🧭 Geopark Trails": layer_geopark
};

L.control.layers(baseLayers, overlayLayers, { collapsed: false }).addTo(map);
map.on('overlayremove', function (eventLayer) {
  if (eventLayer.name === "📍 Districts") {
    document.getElementById('district-info-box').innerHTML = '📍 Click a district to view its info here.';
    selectedDistrict = null;
  }
});


// === 控件 ===
L.control.scale({ imperial: false }).addTo(map);
L.control.coordinates({
  position: "bottomleft",
  decimals: 5,
  useLatLngOrder: true
}).addTo(map);
