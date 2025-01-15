const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  console.log(`Generating token for user ID: ${id}`.yellow); // Debug log
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

module.exports = generateToken;
