const express = require("express");

const cors = require("cors");

const app = express();

const userRoutes=require('./Routes/user.routes')

const port = process.env.PORT || 8080;

// const server = http.createServer(app);

// const initializeSocketIO = require('./socketHandler');

// Define allowed origins for CORS
const allowedOrigins = ["http://localhost:3000"];

// Configure CORS options
const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};




// // Initialize Socket.io
// initializeSocketIO(server);

// Middleware

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/user", userRoutes);



// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
