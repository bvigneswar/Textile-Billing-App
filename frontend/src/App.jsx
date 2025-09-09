import { useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const API_URL = "http://localhost:5001/api/invoices";

function App() {
  const [customer, setCustomer] = useState("");
  const [date, setDate] = useState("");
  const [items, setItems] = useState([{ name: "", qty: 1, price: 0 }]);

  // Always parse numbers, defaults to zero for invalid input
  const updateItem = (index, field, value) => {
    const copy = [...items];
    if (field === "qty") {
      copy[index][field] = Number(value) >= 0 ? parseInt(value) || 0 : 0;
    } else if (field === "price") {
      copy[index][field] = Number(value) >= 0 ? parseFloat(value) || 0 : 0;
    } else {
      copy[index][field] = value;
    }
    setItems(copy);
  };

  // Total always calculated using sanitized numbers
  const calculateTotal = (items) =>
    items.reduce(
      (sum, it) => sum + (Number(it.qty) || 0) * (Number(it.price) || 0),
      0,
    );
  const total = calculateTotal(items);

  const handleSubmit = async () => {
    const total = calculateTotal(items);
    const invoiceData = { customer, date, items, total };

    try {
      const res = await axios.post(API_URL, invoiceData);
      const { invoiceNumber } = res.data;

      // Generate PDF
      const doc = new jsPDF();

      doc.setFillColor(37, 99, 235);
      doc.rect(10, 10, 190, 20, "F");

      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text("Nexsys Textiles", 14, 23);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text(`Invoice #: ${invoiceNumber}`, 200 - 14, 18, { align: "right" });
      doc.text(`Date: ${date}`, 200 - 14, 26, { align: "right" });

      doc.text(`Customer: ${customer}`, 14, 40);

      const formatCurrency = (num) =>
        "Rs. " +
        Number(num).toLocaleString("en-IN", { minimumFractionDigits: 2 });

      // Table: sanitize numbers for PDF too!
      const tableData = items.map((it, i) => {
        const qty = Number(it.qty) || 0;
        const price = Number(it.price) || 0;
        return [
          i + 1,
          it.name,
          qty,
          formatCurrency(price),
          formatCurrency(qty * price),
        ];
      });

      autoTable(doc, {
        startY: 50,
        margin: { left: 14, right: 14 },
        head: [["#", "Item", "Qty", "Price", "Subtotal"]],
        body: tableData,
        theme: "grid",
        styles: { fontSize: 11 },
        headStyles: {
          fillColor: [37, 99, 235],
          halign: "center",
          textColor: 255,
        },
        bodyStyles: { halign: "center" },
        columnStyles: {
          2: { halign: "center" }, // Qty
          3: { halign: "right" }, // Price
          4: { halign: "right" }, // Subtotal
        },
        foot: [["", "", "", "Total", formatCurrency(total)]],
        footStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          halign: "right",
          fontStyle: "bold",
        },
      });

      const finalY = doc.lastAutoTable.finalY || 100;
      doc.setFontSize(11);
      doc.text("Thank you for your business!", 14, finalY + 20);

      doc.save(`Invoice-${invoiceNumber}.pdf`);

      alert(`Invoice #${invoiceNumber} saved & PDF generated!`);
      setCustomer("");
      setDate("");
      setItems([{ name: "", qty: 1, price: 0 }]);
    } catch (err) {
      console.error(err);
      alert("Error saving invoice");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-6">
      <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-3xl">
        <h1 className="text-3xl font-bold text-blue-700 mb-8 text-center">
          Textile Billing App
        </h1>
        {/* Customer & Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-600 mb-1">Customer</label>
            <input
              type="text"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {/* Items Table */}
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Items</h2>
        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse border rounded-lg">
            <thead>
              <tr className="bg-blue-100 text-gray-700">
                <th className="p-2 border">Product</th>
                <th className="p-2 border w-24">Qty</th>
                <th className="p-2 border w-32">Price</th>
                <th className="p-2 border w-32">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="text-center">
                  <td className="border p-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(idx, "name", e.target.value)}
                      className="w-full border rounded px-2 py-1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      min={0}
                      value={item.qty === 0 ? "" : item.qty}
                      onChange={(e) =>
                        updateItem(
                          idx,
                          "qty",
                          e.target.value === "" ? 0 : parseInt(e.target.value),
                        )
                      }
                      className="w-full border rounded px-2 py-1 text-center"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      min={0}
                      value={item.price === 0 ? "" : item.price}
                      onChange={(e) =>
                        updateItem(
                          idx,
                          "price",
                          e.target.value === ""
                            ? 0
                            : parseFloat(e.target.value),
                        )
                      }
                      className="w-full border rounded px-2 py-1 text-center"
                    />
                  </td>
                  <td className="border p-2">
                    ₹{(Number(item.qty) || 0) * (Number(item.price) || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setItems([...items, { name: "", qty: 1, price: 0 }])}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
          >
            + Add Item
          </button>
          <div className="text-xl font-bold text-gray-800">Total: ₹{total}</div>
        </div>
        <button
          onClick={handleSubmit}
          className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          Save & Generate PDF
        </button>
      </div>
    </div>
  );
}

export default App;
