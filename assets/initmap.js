let initMap = function(mapid) {
	let map = L.map(mapid)

	//L.tileLayer("https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png", {
  L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
		attribution: '<a >© OpenStreetMap contributors</a>',
		maxZoom: 16,
	}).addTo(map);
	
	// アイコン
	map.iconlayer = L.layerGroup()
	map.iconlayer.addTo(map)
	map.addIcon = function(lat, lng, nameorparam, iconurl, iconwidth, iconheight) {
		let name = null
		if (typeof nameorparam == "string") {
			name = nameorparam
		} else if (nameorparam.name) {
			name = nameorparam.name
		}
		let marker = null
		if (iconurl) {
			if (!iconwidth) {
				iconwidth = 32
			}
			if (!iconheight) {
				iconheight = iconwidth
			}
			var icon = L.icon({
				iconUrl: iconurl,
				iconSize: [ iconwidth, iconheight ],
				iconAnchor: [ iconwidth / 2, iconheight / 2 ]
			})
			marker = L.marker([ lat, lng ], {
				title : name,
				icon : icon,
			})
		} else {
			marker = L.marker([ lat, lng ], { title: name })
		}
		if (typeof nameorparam == "function") {
			marker.on("click", function(e) {
				nameorparam(e, name)
			});
		} else {
			marker.bindPopup(
				"<h2>" + name + "</h2>",
				{
					maxWidth: 500
				}
			);
			marker.on("click", function(e) {
				if (nameorparam && nameorparam.callback)
					nameorparam.callback(e, name)
			});
		}
		this.iconlayer.addLayer(marker);
		return marker
	}
	return map
}