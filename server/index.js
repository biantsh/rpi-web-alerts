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
  socket.on('pair-user', room => {
    socket.join(room);
  });

  socket.on('pair-device', room => {
    rooms[room] = true;

    socket.on('disconnect', () => {
      rooms[room] = false;
    });
  });
});

setInterval(() => {
  Object.keys(rooms).forEach(room => {
    io.to(room).emit('pair-device', rooms[room]);
  });
}, 1000);
