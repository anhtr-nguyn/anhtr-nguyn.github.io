import StatusTable from "./reusable/StatusTable.js"
import { PLUGINS_APIKEY } from "./reusable/apikey.js";
import loadScript from "./reusable/loadScript.js";
import "./node_modules/socket.io/client-dist/socket.io.js";
const API_HOST = "https://app.digitalauto.tech"

// socket.io init ----------------------
const socket = io('http://127.0.0.1:3000');
//-------------------------
// ini var
let initialCenter =  { lat: 10.772016, lng:  106.657738 }
let nearbyCar = new Map();
let markers = [];


// ggmap -----------------------
const GoogleMapsLocation = async (apikey, box, initialCenter, {icon = null} = {}) => {
    await loadScript(box.window, `https://maps.googleapis.com/maps/api/js?key=${apikey}`);
    const ggMap = document.createElement("div");
	ggMap.setAttribute("style", `display:flex; height: 100%; width: 100%;`);
	
    const map = new box.window.google.maps.Map(ggMap, {
        zoom: 20,
        center: initialCenter,
    });

	box.injectNode(ggMap);
	
    var imageIcon = {
        url: "https://cdn-icons-png.flaticon.com/512/10480/10480377.png",
        size: new box.window.google.maps.Size(71, 71),
        origin: new box.window.google.maps.Point(0, 0),
        anchor: new box.window.google.maps.Point(17, 34),
        scaledSize: new box.window.google.maps.Size(30, 30)
	};
	markers[0] = initialCenter; // cho nay can lay tu sever
    new box.window.google.maps.Marker({
        position: initialCenter,
        map: map,
        label: "car1",
        draggable: false,
        icon: imageIcon
	});
	bc.addEventListener("message", (e) => {
		let info = e.data;
		let duplicate = false;
		let i = 0;

		for (i = 0; i < markers.length; i++) {
			if (markers[i].lat == info.get("lat") && markers[i].lng == info.get("lng")) {
				duplicate = true;
			}
		}
		if (duplicate == false) {
			new box.window.google.maps.Marker({
				position: {lat: info.get("lat"), lng: info.get("lng")},
				map: map,
				label: info.get("nameCar"),
				draggable: false,
				icon: imageIcon
			});
			markers[i] = { lat: info.get("lat"), lng: info.get("lng") }
			console.log("added marker")
		}
	});
	// new box.window.google.maps.Marker({
    //     position: {lat : 10.772099730111755, lng: 106.65794507853887},
    //     map: map,
    //     label: nameCar,
    //     draggable: false,
    //     icon: imageIcon
    // });
    // box.window.google.maps.event.addListener(marker, 'dragend', function(ev){
	// 	marker.setPosition(marker.getPosition());
    //     console.log(marker.getPosition().lat());
    //     console.log(marker.getPosition().lng());
	// 	initialCenter = marker.getPosition();
	// });
}
// plugin ----------------------
const plugin = ({ widgets, simulator, vehicle }) => {

	const otherCarInfo = document.createElement("div")
	otherCarInfo.innerHTML = `
	<style>
		table {
		font-family: arial, sans-serif;
		border-collapse: collapse;
		width: 100%;
		}
		td, th {
		border: 1px solid #dddddd;
		text-align: left;
		padding: 8px;
		}
		tr:nth-child(even) {
		background-color: #dddddd;
		}
	</style>
	<h2>CarNearby</h2>
	<table id="carTable">
		<tr>
		<th>Name Car</th>
		<th>Speed</th>
		<th>Want to take l/r</th>
		<th>Distance (m)</th>
		</tr>
	</table>
	`
    const bc = document.createElement("div")
    bc.innerHTML = `
    <span id = "message">Connecting...</span>
    `
	message = bc.querySelector("#message");
    socket.on('connect', () => {
        message.innerHTML = `connected to ${socket.id}`;
    })

    let speed = 50; // fetch from playground
	let light = "R"; // fetch from playground
	
	

    const info = new Map([
        ["nameCar", "Car2"],
        ["speed", speed],
        ["light", light],
        ["lat", initialCenter.lat],
        ["lng",initialCenter.lng]
    ]);

	// Receive message
	// bc.addEventListener('message', (event) => {
		// let info = event.data;
		// let table = otherCarInfo.querySelector('#carTable');
		// let distance = calculateDistance(initialCenter.lat, initialCenter.lng,
		// 								info.get("lat"),info.get("lng")).toFixed(3);
		// if (nearbyCar.has(info.get("nameCar")) == false) {
		// 	let row = table.insertRow();
		// 	let cell1 = row.insertCell(0);
		// 	let cell2 = row.insertCell(1);
		// 	let cell3 = row.insertCell(2);
		// 	let cell4 = row.insertCell(3);
		// 	cell1.innerHTML = info.get("nameCar");
		// 	cell2.innerHTML = info.get("speed");
		// 	cell3.innerHTML = info.get("light");
		// 	cell4.innerHTML = distance;
		// 	nearbyCar.set(info.get("nameCar"), 1);
		// }
		// else {
		// 	//  check distance to delete
		// 	if (distance > 30) {
		// 		// delete in map
		// 		nearbyCar.delete(info.get("nameCar"))
		// 		// delete row in table
		// 		let rows = table.getElementsByTagName("tr");
		// 		for (var i = 1; i < rows.length; i++) {
		// 			var row = rows[i];
		// 			var firstCell = row.getElementsByTagName("td")[0];
					
		// 			if (firstCell.textContent === info.get("nameCar")) {
		// 				table.deleteRow(i);
		// 				break;
		// 			}
		// 		}
		// 	}
		// 	console.log("The same car!")
		// }
	// })
    // widget register ----------------------------
    widgets.register("Boardcast", (box) => {
        box.injectNode(bc)
    })
	widgets.register("listCar", (box) => {
		box.injectNode(otherCarInfo)
	})
	widgets.register("Table",
        StatusTable({
            apis:["Vehicle.AverageSpeed","Vehicle.TravelledDistance", "Vehicle.ADAS.CruiseControl.SpeedSet"],
            vehicle: vehicle,
		    refresh: 800         
        })
	)
	widgets.register(
        "GoogleMapLocation",
		(box) => {
			GoogleMapsLocation(PLUGINS_APIKEY, box, initialCenter)
		}
	)
}
function calculateDistance(lat1, lon1, lat2, lon2) {
	const R = 6371; // Radius of the Earth in kilometers
  
	// Convert latitude and longitude to radians
	const lat1Rad = toRadians(lat1);
	const lon1Rad = toRadians(lon1);
	const lat2Rad = toRadians(lat2);
	const lon2Rad = toRadians(lon2);
  
	// Calculate the differences between the coordinates
	const dLat = lat2Rad - lat1Rad;
	const dLon = lon2Rad - lon1Rad;
  
	// Apply the Haversine formula
	const a =
	  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
	  Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	const distance = R * c*1000;
  
	return distance;
}
  
function toRadians(degrees) {
	return degrees * (Math.PI / 180);
}

export default plugin