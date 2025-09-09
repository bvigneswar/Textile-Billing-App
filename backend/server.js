import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// connect DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// invoice model
const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: Number, required: true, unique: true },
    customer: String,
    date: String,
    items: [{ name: String, qty: Number, price: Number }],
    total: Number,
  },
  { timestamps: true }, // so you can sort by createdAt if needed
);

const Invoice = mongoose.model("Invoice", invoiceSchema);

// === Routes ===

// Create Invoice with auto-increment invoiceNumber
app.post("/api/invoices", async (req, res) => {
  try {
    // Find the last invoice
    const lastInvoice = await Invoice.findOne().sort({ invoiceNumber: -1 });
    const nextInvoiceNumber = lastInvoice ? lastInvoice.invoiceNumber + 1 : 1;

    const invoice = new Invoice({
      ...req.body,
      invoiceNumber: nextInvoiceNumber,
    });

    await invoice.save();
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all invoices
app.get("/api/invoices", async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ invoiceNumber: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single invoice by invoiceNumber
app.get("/api/invoices/:number", async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ invoiceNumber: req.params.number });
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
