const express = require('express');
const cors = require('cors');
const socketio = require('socket.io');

const app = express();

app.use(cors());
app.use(express.static('dist'));

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const io = socketio(server);

const rooms = {};

io.on('connection', socket => {
  socket.on('watch-room', room => {
    socket.join(room);
  });

  socket.on('join-room', room => {
    socket.join(room);
  
    rooms[room] = true;
    io.to(room).emit('device-paired', rooms[room]);

    socket.on('disconnect', () => {
      rooms[room] = false;
      io.to(room).emit('device-unpaired', rooms[room]);
    });
  });
});

setInterval(() => {
  Object.keys(rooms).forEach(room => {
    io.to(room).emit('device-paired', rooms[room]);
  });
}, 1000);
