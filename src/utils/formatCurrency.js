// utils/formatCurrency.js
export const formatCurrency = (amount) => {
  // Handle string inputs like "GH₵250.00" by extracting the numeric value
  let numericAmount = amount;
  if (typeof amount === "string") {
    numericAmount = parseFloat(amount.replace(/[^\d.-]/g, ""));
  }

  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
  }).format(numericAmount);
};
