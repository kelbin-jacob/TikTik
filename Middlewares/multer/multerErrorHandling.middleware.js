const multer = require("multer"); // Import multer module

// Define a custom error handler middleware
const errorHandlerMiddleware = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.log(err,"22223");
    // Handle Multer errors (e.g., file size exceeded)
    return res.status(400).json({ error: "Unexpected field recieved " });
  }

  if (err) {
    // Handle other errors (e.g., invalid file type)
    const status = err.status || 500;
    const response = err.details || { error: "Internal server error" };
    return res.status(status).json(response);
  }

  // Pass control to the next middleware if no errors occurred
  next();
};

module.exports = errorHandlerMiddleware;
