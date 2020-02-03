let selectedPoint = [ 35.170915, 136.881537 ];
let nagoyaMap = {};
let markerOld = [];
let map;
let serverURL = "https://##########/";//ここにAPIサーバのルートアドレス

function setPoint (lat,lng) {
  selectedPoint = [lat,lng];
}

//Mapの初期化
const initMap = function(mapid) {
  let map = L.map(mapid);
  //ライセンス上Attributeに© OpenStreetMap contributorsを明記する
  L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
    attribution: '<a >© OpenStreetMap contributors</a>',
    maxZoom: 16,
  }).addTo(map);
  
  map.iconlayer = L.layerGroup();
  map.iconlayer.addTo(map);

  map.addIcon = function(lat, lng, nameorparam, iconurl, iconwidth, iconheight, zIndex, opa) {
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
      const icon = L.icon({
        iconUrl: iconurl,
        iconSize: [ iconwidth, iconheight ],
        iconAnchor: [ iconwidth / 2, iconheight / 2 ]
      })
      marker = L.marker([ lat, lng ], {
        title : name,
        icon : icon,
        zIndexOffset: zIndex,
        opacity: opa
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
        setPoint(e.latlng.lat, e.latlng.lng);
        if (nameorparam && nameorparam.callback)
          nameorparam.callback(e, name)
      });
    }
    this.iconlayer.addLayer(marker);
    return marker
    }
    return map
  }

function setSpot(data) {
  for(let i=0;i<data.length;i++){
    map.addIcon(data[i].lat, data[i].lng, data[i].name+"<br/>"+data[i].description, "assets/pin.png", 30, 30, 10000,0.8)
  }
}

function iconName(timeTo){
  timeTo = Math.floor(timeTo / 10) + 1;
  if(timeTo>6){
    timeTo=6;
  }
  return "assets/icon" + timeTo + ".png";
}

//ウィンドウロード時にマップを描画する関数
window.onload = async function() {

  await axios.get('assets/reach_difficulty.geojson')
  .then(function (response) {
    nagoyaMap = response.data;
  })
  .catch(function (error) {
    console.log(error);
  })
  .then(function () {
  });

  map = initMap('map');
  map.setZoom(12);
  map.panTo([ 35.1546144, 136.9323453 ]);
  map.on("click", (e)=> setPoint(e.latlng.lat,e.latlng.lng));
  map.addIcon(35.170915, 136.881537, "名古屋駅<br/>出発地点", "assets/station.png", 45, 45, 20000, 1);

  for(let i=0;i<nagoyaMap.features.length;i++){
    const rootProp = nagoyaMap.features[i].properties;
    const a_lat = rootProp.lat;
    const a_lng = rootProp.lng;
    const a_name = rootProp.address;

    const money = Math.round(((rootProp.trainfare + 300)/950) * 30);
    const text = "往復時間：" + "徒歩" +　rootProp.walktime*2 + "+電車" + rootProp.traintime*2 + "=" + (rootProp.walktime*2 + rootProp.traintime*2)+ "分<br/>";
    markerOld[i] = map.addIcon(a_lat,a_lng, text + "金額（往復）："+rootProp.trainfare*2+"円<br/>"+a_name+"<br/>",iconName(rootProp.totaltime),money,money,1000,0.3);
  }

  //スポットの描画
  await axios.get(serverURL + "spot")
  .then(function (response) {
    setSpot(response.data);
  })
  .catch(function (error) {
    window.alert("現在観光情報を返すサーバーが起動しておらず，観光情報を表示することができません．");
    console.log(error);
  })
  .then(function () {
  });
}

//指定された時間で到達できる範囲まで絞ったMapを描画
async function limitMap(select_value) {
  //APIサーバからデータを取得する
  await axios.get(serverURL + 'query?freetime='+ select_value)
  .then(function (response) {
    console.log(response);
    nagoyaMap = response;
    for(let j=0;j<markerOld.length;j++){
      map.removeLayer(markerOld[j]);
    }
    markerOld = [];
    for(let i=0;i<nagoyaMap.data.length;i++){
      const rootProp = nagoyaMap.data[i];
      const money = Math.round(((rootProp.trainfare + 300)/950) * 30);
      const text = "往復時間：" + "徒歩" +　rootProp.walktime*2 + "+電車" + rootProp.traintime*2 + "=" + (rootProp.walktime*2 + rootProp.traintime*2)+ "分<br/>";
      markerOld[i] = map.addIcon(rootProp.lat, rootProp.lng, text + "金額（往復）："+rootProp.trainfare*2+"円<br/>" + rootProp.address, iconName(rootProp.totaltime), money ,money, 1000,0.3);
    }
  })
  .catch(function (error) {
    window.alert("現在到達難易度情報を返すサーバーが起動しておらず，時間を絞って表示することができません．");
    console.log(error);
  })
  .then(function () {
  });
}

//範囲を絞って見るボタンが押された場合
function showclicked () {
  const index_select = document.form1.selectmenu.selectedIndex;
  const select_value = document.form1.selectmenu.options[index_select].value;
  limitMap(select_value);
}

//経路ボタンが押された場合
function routeclicked () {
  const destination = selectedPoint;
  //名古屋駅から目的地までの経路を新規タブでGoogleMapで開く
  const routeURL = "https://www.google.com/maps/dir/?api=1&origin=名古屋駅&destination=" + destination[0] + "," + destination[1];
  window.open(routeURL);
}