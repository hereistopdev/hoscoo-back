const express = require("express");
const router = express.Router();
const Account = require("../models/Account");
const User = require("../models/User");

// Create Account
function generateRandomAccountNumber() {
  const generateGroup = () => Math.floor(1000 + Math.random() * 9000).toString(); // Generates a 4-digit group

  return `${generateGroup()}${generateGroup()}${generateGroup()}${generateGroup()}`;
}

router.post("/", async (req, res) => {
  try {
    const { user_id, account_type, balance, currency } = req.body;

    console.log(user_id, account_type, balance, currency);

    if (!user_id || !account_type || !currency) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    // Validate user_id exists
    const user = await User.findById(user_id);
    if (!user) return res.status(400).json({ message: "User not found" });

    const account_number = generateRandomAccountNumber();

    const account = new Account({ user_id, account_type, balance, currency, account_number });
    await account.save();

    res.status(201).json({ message: "Account created", account });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

router.post("/all", async (req, res) => {
  try {
    const { user_id } = req.body;

    console.log(user_id);

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Find all accounts associated with the user_id
    const accounts = await Account.find({ user_id });
    if (accounts.length === 0)
      return res.status(404).json({ message: "No accounts found for this user" });

    res.status(200).json(accounts);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Read Accounts
router.get("/:id", async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) return res.status(404).json({ message: "Account not found" });

    res.status(200).json(account);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Update Account
router.put("/:id", async (req, res) => {
  try {
    const { account_type, balance, currency } = req.body;

    const account = await Account.findById(req.params.id);
    if (!account) return res.status(404).json({ message: "Account not found" });

    if (account_type) account.account_type = account_type;
    if (balance !== undefined) account.balance = balance;
    if (currency) account.currency = currency;
    account.updated_at = Date.now();

    await account.save();
    res.status(200).json({ message: "Account updated", account });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Delete Account
router.delete("/:id", async (req, res) => {
  try {
    const account = await Account.findByIdAndDelete(req.params.id);
    if (!account) return res.status(404).json({ message: "Account not found" });

    res.status(200).json({ message: "Account deleted", account });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
