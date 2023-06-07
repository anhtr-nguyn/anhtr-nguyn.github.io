const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: ['https://digitalauto.netlify.app/model/gvizddVi65gftkk3a1GO/library/prototype/6CfdPB3AMp0yoNPlC4D1/view/run']
});
let location = [{name: "car1",lat: 10.772654, lng: 106.656051},
                {name: "car2",lat: 10.772698, lng: 106.656157},
                {name: "car3",lat: 10.772719, lng: 106.656071},
                {name: "car4",lat: 10.772656, lng: 106.656096}];
let i = 0;
let markers = [];
io.on('connection',(socket)=> {
  console.log(`user connected ${socket.id}`)
  socket.on("requestMarker", () => {
    socket.emit("addMarker", markers);
    io.emit("marker", location[i]);
    markers.push(location[i]);
    console.log(markers)
  })
  i = (i + 1) % location.length;
  markers.length = io.engine.clientsCount;
})
server.listen(3000, () => {
  console.log('listening on *:3000');
});
