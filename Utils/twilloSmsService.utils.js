const twilio = require('twilio');
require("dotenv").config();
const mustache = require('mustache');

// Constants for Twilio Credentials
const TWILIO_ACCOUNT_SID =process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

// Create a Twilio client
const client = new twilio.Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);


// Create an asynchronous function to send OTP
async function twilioSendOTP(phoneNumber, otp) {
  try {
    const message = await client.messages.create({
      to: phoneNumber,
      from:process.env.TWILIO_PHONE_NUMBER,
      body: `Hello, your OTP for verification is: ${otp}`,
    });

    // Log the message SID for reference
    console.log(`OTP sent successfully. Message SID: ${message.sid}`);

    return message;
  } catch (error) {
    console.error('Error sending OTP:', error.message);
    return error; // Return the error object
  }
}

// // Function to generate dynamic TwiML with the OTP
// function generateTwiMLWithOTP(otp) {
//   const twimlTemplate = `<?xml version="1.0" encoding="UTF-8"?>
//     <Response>
//       <Say>Hello, your OTP for verification is: ${otp}</Say>
//     </Response>`;

//   return mustache.render(twimlTemplate, { OTP: otp });
// }

// // Create an asynchronous function to make a recorded voice call
// async function twilioMakeVoiceCall(phoneNumber, otp) {
//   try {
//     const twimlContent = generateTwiMLWithOTP(otp); // Generate TwiML content

//     const call = await client.calls.create({
//       to: phoneNumber,
//       from: process.env.TWILIO_PHONE_NUMBER,
//       url: "asda"
//     });

//     // Log the call SID for reference
//     console.log(`Voice call initiated. Call SID: ${call.sid}`);

//     return call;
//   } catch (error) {
//     console.error('Error making voice call:', error.message);
//     return error; // Return the error object
//   }
// }





module.exports = { twilioSendOTP,client };