var attrLandsD = 'Map data &copy; The Government of the Hong Kong SAR <img src="https://api.hkmapservice.gov.hk/mapapi/landsdlogo.jpg" alt="Lands Department" style="width:15px;height:15px;">';

L.HongKong = {
    urlBase: "https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz",
    basemap: {
        topography: {
            path: "/basemap",
			minZoom: 10,
            maxZoom: 20
        },
        imagery: {
            path: "/imagery",
			minZoom: 4,
            maxZoom: 19
        }
    },
    label: {
        en: {
            path: "/label/hk/en",
			minZoom: 4,
            maxZoom: 20
        },
        tc: {
            path: "/label/hk/tc",
			minZoom: 4,
            maxZoom: 20
        },
        sc: {
            path: "/label/hk/sc",
			minZoom: 4,
            maxZoom: 20
        }
    },
    crs: {
        wgs84: "WGS84",
        hk80: "HK80"
    }
};

L.TileLayer.HongKong = L.TileLayer.extend({
    initialize: function(mapType, options) {
        var mapTypes = L.HongKong;
        var toks = mapType.split(".");
        var base = toks[0];
        var target = "";
        if (toks.length >= 2) {
            target = toks[1];
        }

        if (target == "") {
            // default target for basemap is 'topography'
            if (base == "basemap") {
                target = "topography";
            }

            //default target for label is 'tc'
            if (base == "label") {
                target = "tc";
            }
        }

        if (!(base in mapTypes) || !(target in mapTypes[base])) {
            if (!(base in mapTypes)) {
                throw "basemap type should be either 'basemap' or 'label', while you are using " + base;
            }

            if ((base in mapTypes) && !(target in mapTypes[base])) {
                if (base == "basemap") {
                    throw "basemap target should be either 'topography' or 'imagery', while you are using " + target;
                }

                if (base == "imagery") {
                    throw "label target should be either 'en' for english, 'tc' for traditional chinese or 'sc' for simplified chinese, while you are using " + target;
                }

            }
        }

        var tileTarget = mapTypes[base][target];
        var url = mapTypes.urlBase + tileTarget.path + "/" + mapTypes.crs.wgs84 + "/{z}/{x}/{y}.png";
		var defaultOpts = {};
		var labelParent = "";
		
		if (base == "basemap") {
			defaultOpts = {
			minZoom: tileTarget.minZoom,
			maxZoom: tileTarget.maxZoom,
			attribution: attrLandsD
			};
			L.setOptions(this, defaultOpts);
			L.TileLayer.prototype.initialize.call(this, url, options);
		} else {
			if (toks.length == 3) {
				labelParent = toks[2];
			} else {
				labelParent = "topography";
			}
			if (labelParent == "topography") {
				defaultOpts = {
					minZoom: L.HongKong.basemap.topography.minZoom,
					maxZoom: 20,
					attribution: attrLandsD
				};
			} else {
				defaultOpts = {
					minZoom: 4,
					maxZoom: L.HongKong.basemap.imagery.maxZoom,
					attribution: attrLandsD
				};
			}
			L.setOptions(this, defaultOpts);
			L.TileLayer.prototype.initialize.call(this, url, options);
		}
    }
});

L.LayerGroup.HongKong = L.LayerGroup.extend({
    initialize: function(mapType, options) {
        var mapTypes = L.HongKong;
        var toks = mapType.split(".");
        var basemap = toks[0];
        var label = "tc";
        if (toks.length >= 2) {
            label = toks[1];
        }

        if (!(basemap in mapTypes["basemap"])) {
            throw "basemap type should be either 'topography' or 'imagery', while you are using " + basemap;
        }

        if (!(label in mapTypes["label"])) {
            throw "label language should be either 'en' for english, 'tc' for traditional chinese or 'sc' for simplified chinese, while you are using " + label;
        }

        this._basemapLayer = L.tileLayer.hongKong("basemap." + basemap);
        this._labelLayer = L.tileLayer.hongKong("label." + label + "." + basemap);
		
        var myLayers = [this._basemapLayer, this._labelLayer];
        L.LayerGroup.prototype.initialize.call(this, myLayers, options);
    },

    language: function(language) {
        var mapTypes = L.HongKong;
        if (!(language in mapTypes["label"])) {
            throw "should be either 'en' for english, 'tc' for traditional chinese or 'sc' for simplified chinese, while you are using " + language;
        }

        this.removeLayer(this._labelLayer);
        this._labelLayer = L.tileLayer.hongKong("label." + language);
        this.addLayer(this._labelLayer);
    }
});

L.tileLayer.hongKong = function(type, options) {
    return new L.TileLayer.HongKong(type, options);
};

L.layerGroup.hongKong = function(type, options) {
    return new L.LayerGroup.HongKong(type, options);
};