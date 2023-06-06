import GoogleMapsPluginApi from "./reusable/GoogleMapsPluginApi.js"
import GoogleMapsFromSignal from "./reusable/GoogleMapsFromSignal.js"
import StatusTable from "./reusable/StatusTable.js"
import GoogleMapsLocation from "./reusable/GoogleMapsLocation.js";
import { PLUGINS_APIKEY } from "./reusable/apikey.js";

const API_HOST = "https://app.digitalauto.tech"

const bc = new BroadcastChannel('my-channel');
const initialCenter = { lat: 10.772105, lng: 106.657874 }

const plugin = ({ widgets, simulator, vehicle }) => {
	
    const container = document.createElement("div")
	container.style = "width:100%;height:100%"
	container.innerHTML = `
		<button id = "bcc">Start broadcast!</button>
		<p id="mess">Waiting message...</p>
	`
    const btn = container.querySelector('#bcc');

    let speed = 50; // fetch from playground
    let light = "R"; // fetch from playground
    const info = new Map([
        ["nameCar", "Car2"],
        ["speed", speed],
        ["light", light],
        ["lat", initialCenter.lat],
        ["lng",initialCenter.lng]
    ]);
    // Send message
    btn.addEventListener('click', () => {
        bc.postMessage(info);
    })
    // Receive message
    bc.addEventListener('message', (event) => {
        
    	console.log(event.data);
    })
	widgets.register("bc", (box) => {
		box.injectNode(container)
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


export default plugin