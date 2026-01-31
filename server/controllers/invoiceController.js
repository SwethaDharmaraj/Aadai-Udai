const PDFDocument = require('pdfkit');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');

exports.generateInvoice = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findOne({ _id: orderId, user: req.user._id }).populate('items.product');

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const transaction = await Transaction.findOne({ order: order._id });

        // Create a document
        const doc = new PDFDocument({ margin: 50 });

        // Set response headers
        const filename = `Invoice_${order.orderId}.pdf`;
        res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-type', 'application/pdf');

        // Pipe results to response
        doc.pipe(res);

        // Header
        doc.fillColor('#444444')
            .fontSize(20)
            .text('AADAIUDAI', 50, 57)
            .fontSize(10)
            .text('Indian Ethnic Dress Shop', 50, 80)
            .text('123, Fashion Street', 200, 65, { align: 'right' })
            .text('Chennai, Tamil Nadu, 600001', 200, 80, { align: 'right' })
            .moveDown();

        // Invoice Details
        doc.fillColor('#000000')
            .fontSize(16)
            .text('INVOICE', 50, 130, { align: 'center' });

        generateHr(doc, 150);

        const customerInfoTop = 160;

        doc.fontSize(10)
            .text('Invoice Number:', 50, customerInfoTop)
            .font('Helvetica-Bold')
            .text(order.orderId, 150, customerInfoTop)
            .font('Helvetica')
            .text('Invoice Date:', 50, customerInfoTop + 15)
            .text(new Date(order.createdAt).toDateString(), 150, customerInfoTop + 15)
            .text('Transaction ID:', 50, customerInfoTop + 30)
            .text(transaction ? transaction.transactionId : 'N/A', 150, customerInfoTop + 30)
            .text('Payment Method:', 50, customerInfoTop + 45)
            .text(transaction ? transaction.paymentMethod : 'N/A', 150, customerInfoTop + 45)

            .font('Helvetica-Bold')
            .text(order.shippingAddress.name, 300, customerInfoTop)
            .font('Helvetica')
            .text(order.shippingAddress.addressLine1, 300, customerInfoTop + 15)
            .text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`, 300, customerInfoTop + 30)
            .text(`Phone: ${order.shippingAddress.phone}`, 300, customerInfoTop + 45)
            .moveDown();

        generateHr(doc, 225);

        // Table Header
        const invoiceTableTop = 240;
        doc.font('Helvetica-Bold');
        generateTableRow(doc, invoiceTableTop, 'Item', 'Size', 'Qty', 'Price', 'Total');
        generateHr(doc, invoiceTableTop + 20);
        doc.font('Helvetica');

        let i = 0;
        const items = order.items;
        for (i = 0; i < items.length; i++) {
            const item = items[i];
            const position = invoiceTableTop + (i + 1) * 30;
            generateTableRow(
                doc,
                position,
                item.name,
                item.size,
                item.quantity,
                item.price,
                item.price * item.quantity
            );
            generateHr(doc, position + 20);
        }

        const subtotalPosition = invoiceTableTop + (i + 1) * 30;
        doc.font('Helvetica-Bold');
        generateTableRow(
            doc,
            subtotalPosition,
            '',
            '',
            'Total',
            '',
            order.subtotal
        );

        // Footer
        doc.fontSize(10)
            .text('Thank you for shopping with AADAIUDAI!', 50, 700, { align: 'center', width: 500 });

        doc.end();

    } catch (err) {
        console.error('Invoice generation error:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Could not generate invoice' });
        }
    }
};

function generateHr(doc, y) {
    doc.strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke();
}

function generateTableRow(doc, y, item, size, qty, price, total) {
    doc.fontSize(10)
        .text(item, 50, y)
        .text(size, 280, y, { width: 90, align: 'right' })
        .text(qty, 370, y, { width: 90, align: 'right' })
        .text(price, 400, y, { width: 90, align: 'right' })
        .text(total, 0, y, { align: 'right' });
}
