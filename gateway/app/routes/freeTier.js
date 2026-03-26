// Updated logic to handle free tier transitions with Lightning invoices
const Lightning = require("../services/lightning");

module.exports.handleRequest = async (req, res) => {
  const user = req.user;

  if (user.freeTierUsedUp) {
    const invoice = await Lightning.generateInvoice(user.id, 100); // Fixed amount for demo

    return res.status(402).json({
      error: "free_tier_exceeded",
      message: "Free tier usage exceeded. Please pay the attached invoice to continue.",
      invoice: invoice.lnurl,
    });
  }

  // Handle other routes normally
};