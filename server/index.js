const express = require('express');
const cors = require('cors');
const socketio = require('socket.io');

const app = express();

app.use(cors());
app.use(express.static('dist'));

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const io = socketio(server);

const userCountUpdateDelay = 1000;

const rooms = {};

io.on('connection', socket => {
  socket.on('watch-room', room => {
    socket.join(room);
    if (!rooms[room]) {
      rooms[room] = 0;
    }
    io.to(room).emit('user-count-change', rooms[room]);
  });

  socket.on('join-room', room => {
    socket.join(room);
    if (!rooms[room]) {
      rooms[room] = 0;
    }
    rooms[room]++;
    io.to(room).emit('user-count-change', rooms[room]);

    socket.on('disconnect', () => {
      rooms[room]--;
      io.to(room).emit('user-count-change', rooms[room]);
    });
  });
});

setInterval(() => {
  Object.keys(rooms).forEach(room => {
    io.to(room).emit('user-count-change', rooms[room]);
  });
}, userCountUpdateDelay);
