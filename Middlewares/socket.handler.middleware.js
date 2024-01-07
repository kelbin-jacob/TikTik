const chatHistory=require('../Models/chatHistory.model')
// Function to initialize Socket.io
function initializeSocketIO(server) {
    const io = require('socket.io')(server);
  
    io.on('connection', (socket) => {
      console.log('A user connected');
  
      // Listen for chat messages
      socket.on('chat message', async (msg) => {
        try {
          // Save the message to the database
          const newMessage = await Message.create({
            fromUserId: msg.fromUserId,
            toUserId: msg.toUserId,
            content: msg.content,
          });
  
          // Broadcast the message to all connected clients
          io.emit('chat message', newMessage.toJSON());
        } catch (error) {
          console.error('Error saving message:', error.message);
        }
      });
  
      // Load previous messages from the database
      chatHistory.findAll()
        .then((messages) => {
          socket.emit('load messages', messages);
        })
        .catch((error) => {
          console.error('Error loading messages:', error.message);
        });
  
      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('User disconnected');
      });
    });
  }

  
// Socket.IO connection logic for notification
// io.on('connection', (socket) => {
//     console.log('A user connected');
  
//     // Handle events (e.g., sending and receiving messages)
//     socket.on('sendMessage', async (data) => {
//       const { userId, message } = data;
  
//       // Save the message to the database with the corresponding user ID
//       await chatHistory.create({ userId, text: message });
  
//       // Broadcast the message to the specific user
//       io.to(userId).emit('newMessage', { message });
//     });
  
//     // Handle disconnection
//     socket.on('disconnect', () => {
//       console.log('User disconnected');
//     });
//   });
  
  
  export default initializeSocketIO;