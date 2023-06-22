const express = require("express");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { writeUsers, readUsers } = require("../utils/utils");
const { SECRET } = require("../config");

const router = express.Router();

// Endpoint for user registration
router.post(
  "/register",
  // Request body validation using express-validator
  [
    body("name")
      .isString()
      .isLength({ min: 3 })
      .withMessage("Name should be at least 4 characters long."),
    body("email")
      .isString()
      .isEmail()
      .withMessage("Please enter a valid email."),
    body("password")
      .isString()
      .isLength({ min: 8 })
      .withMessage("Password should be at least 8 characters long."),
  ],
  async (req, res) => {
    const { name, email, password } = req.body;

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "User registration failed.",
        error: errors.array(),
        data: {},
      });
    }

    try {
      // Hash the password using bcrypt
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a new user object
      const newUser = {
        name,
        email,
        password: hashedPassword,
      };

      // Add the user to the USER array
      const users = await readUsers();
      users.push(newUser);
      writeUsers(users);

      // Generate a JWT access token
      const token = jwt.sign({ email }, SECRET);

      return res.status(201).json({
        message: "User registration successful.",
        error: null,
        data: {
          newUser,
          access_token: token,
          user: newUser.name,
        },
      });
    } catch (error) {
      console.error("Error:", error.message);
      return res.status(500).send("Internal server error occurred.");
    }
  }
);

// Endpoint for user login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Read users from storage
    const users = await readUsers();

    // Find the user with the provided email
    const user = users.find((user) => user.email === email);

    if (!user) {
      // User not found
      return res.status(404).json({
        message: "User login failed.",
        error: "User not found.",
        data: {},
      });
    }

    // Compare passwords using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Invalid password
      return res.status(404).json({
        message: "User login failed.",
        error: "Invalid password.",
        data: {},
      });
    }

    // Generate a JWT access token
    const token = jwt.sign({ email }, SECRET);

    return res.status(200).json({
      message: "User login successful.",
      error: null,
      data: {
        access_token: token,
      },
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).send("Internal server error occurred.");
  }
});

module.exports = router;
