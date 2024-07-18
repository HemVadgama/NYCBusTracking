const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fetch = require('node-fetch');
const GtfsRealtimeBindings = require('gtfs-realtime-bindings');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('a user connected');
});

const fetchData = async () => {
    try {
        const response = await fetch("https://gtfsrt.prod.obanyc.com/vehiclePositions?key=6eb7f375-1c9b-4919-9802-53c35aabb2c6", {
            headers: {
                "x-api-key": "6eb7f375-1c9b-4919-9802-53c35aabb2c6",
            },
        });

        if (!response.ok) {
            throw new Error(`${response.url}: ${response.status} ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));

        const positions = feed.entity
            .filter(entity => entity.vehicle && entity.vehicle.position)
            .map(entity => ({
                latitude: entity.vehicle.position.latitude,
                longitude: entity.vehicle.position.longitude
            }));

        // console.log('Emitting positions:', positions); // Debugging line
        io.emit('update', positions);
    } catch (error) {
        console.error(error);
    }
};

setInterval(fetchData, 3000); // Fetch data every 3 second
const PORT = process.env.PORT || 80;

server.listen(PORT, () => {
    console.log('listening on *:${PORT}');
});
