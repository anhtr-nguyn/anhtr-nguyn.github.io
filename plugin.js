import StatusTable from "./reusable/StatusTable.js"
import { PLUGINS_APIKEY } from "./reusable/apikey.js";
import loadScript from "./reusable/loadScript.js";
import "./node_modules/socket.io/client-dist/socket.io.js";
const API_HOST = "https://app.digitalauto.tech"

// socket.io init ----------------------
const socket = io('http://127.0.0.1:3000');
//-------------------------
// ini var
let initialCenter = {lat:0, lng:0};
let nearbyCar = new Map();
let haveMarker = false; // cho nay co the sai



// ggmap -----------------------
const GoogleMapsLocation = async (apikey, box, initialCenter, {icon = null} = {}) => {
    await loadScript(box.window, `https://maps.googleapis.com/maps/api/js?key=${apikey}`);
	const ggMap = document.createElement("div");
	ggMap.setAttribute("style", `display:flex; height: 100%; width: 100%;`);
    const map = new box.window.google.maps.Map(ggMap, {
        zoom: 20,
        center: initialCenter,
    });
    var imageIcon = {
        url: "https://cdn-icons-png.flaticon.com/512/10480/10480377.png",
        size: new box.window.google.maps.Size(71, 71),
        origin: new box.window.google.maps.Point(0, 0),
        anchor: new box.window.google.maps.Point(17, 34),
        scaledSize: new box.window.google.maps.Size(30, 30)
	};
	socket.on("marker", (location) => {
		initialCenter = location;
		new box.window.google.maps.Marker({
			position: {lat: location.lat, lng: location.lng},
			map: map,
			label: location.name,
			draggable: false,
			icon: imageIcon
		});
		haveMarker = true;
		map.setCenter(location);
	})
	socket.on("addMarker", markers => {
		for (let j = 0; j < markers.length; j++) {
			if (markers[j] != null) {
				new box.window.google.maps.Marker({
					position: {lat: markers[j].lat, lng: markers[j].lng},
					map: map,
					label: markers[j].name,
					draggable: false,
					icon: imageIcon
				});
			}
		}	
	})
	box.injectNode(ggMap);
}
// plugin ----------------------
const plugin = ({ widgets, simulator, vehicle }) => {

	let intitialSpeed = 30; 
	let initialLeft = true;
	let initialRight = false;
	let initialLat = initialCenter.lat;
	let initialLng = initialCenter.lng;
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
	bc.style = `margin:10px,display: flex;
	justify-content: center;
	align-items: center;`
	bc.innerHTML = `
	<span id = "message">If you are not connectting to sever. Please refresh the page</span>
	`
	const control = document.createElement("div")
	control.innerHTML = `
	<title>Light Control</title>
	<h1>Light Control</h1>
    <button type="button">Left Light</button>
    <button type="button">Right Light</button>
	`
	let leftBtn = control.querySelector("#left-light")
	let rightBtn = control.querySelector("#right-light")
	if(leftBtn) {
        leftBtn.addEventListener("click", () => {
            console.log('leftBtn click')
			initialLeft = true;
			initialRight = false;
        })
    }
    if(rightBtn) {
        rightBtn.addEventListener("click", () => {
			console.log('rightBtn click')
			initialRight = true;
			initialLeft = false;
        })
	}
	simulator("Vehicle.Speed", "get", () => {
		return intitialSpeed;
	});
	simulator("Vehicle.Body.Lights.IsLeftIndicatorOn", "set", (value) => {
		initialLeft = value;
	});
	simulator("Vehicle.Body.Lights.IsRightIndicatorOn", "set", (value) => {
		initialRight = value;
	});
	simulator("Vehicle.Body.Lights.IsLeftIndicatorOn", "get", () => {
		return initialLeft;
	});
	simulator("Vehicle.Body.Lights.IsRightIndicatorOn", "get", () => {
		return initialRight;
	});

	let sim_function;
	simulator("Vehicle.Speed", "subscribe", async ({func, args}) => {
		sim_function = args[0]
	})

    // widget register ----------------------------
	socket.on('connect', () => {
		let mess = bc.querySelector("#message");
		mess.innerHTML = `You have connected to sever, you ID: ${socket.id}`;
		socket.emit("requestMarker", "give me marker");
		
	})
	widgets.register("Light", (box) => {
		box.injectNode(control)
	})
    widgets.register("Boardcast", (box) => {
        box.injectNode(bc)
    })
	widgets.register("listCar", (box) => {
		box.injectNode(otherCarInfo)
	})
	widgets.register("Table",
        StatusTable({
            apis:["Vehicle.Speed","Vehicle.Body.Lights.IsLeftIndicatorOn", "Vehicle.Body.Lights.IsRightIndicatorOn"],
            vehicle: vehicle,
		    refresh: 1000         
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
