async function generateOTP() {
    return new Promise((resolve) => {
      // Simulate an asynchronous operation
      setTimeout(() => {
        // Generate a random number between 100,000 and 999,999
        const min = 100000;
        const max = 999999;
        const otp = Math.floor(Math.random() * (max - min + 1)) + min;
        resolve(otp);
      }, 0); // Using setTimeout to simulate asynchronicity
    });
  }

  
//   async function sendPushNotification(userId, message) {
//   socket.emit('sendMessage', { userId, message });
// }

  
  module.exports = {generateOTP};
