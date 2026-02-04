import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoice = (order, transaction) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Branding
    doc.setFillColor(139, 21, 56); // #8b1538
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('AADAIUDAI', 20, 25);
    doc.setFontSize(10);
    doc.text('Indian Ethnic Dress Shop', 20, 32);

    // Invoice Details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    const orderId = order.order_id || order.orderId || order.id;
    const transactionId = transaction.transaction_id || transaction.transactionId || transaction.id;
    const paymentMethod = transaction.payment_method || transaction.paymentMethod || 'N/A';
    const razorpayPaymentId = transaction.razorpay_payment_id || transaction.razorpayPaymentId;
    const subtotal = order.total_amount || order.totalAmount || order.subtotal || 0;
    const shippingAddress = order.shipping_address || order.shippingAddress || {};
    const items = order.order_items || order.orderItems || order.items || [];

    doc.text(`Invoice Date: ${new Date().toLocaleString()}`, pageWidth - 20, 55, { align: 'right' });
    doc.text(`Order ID: ${orderId}`, 20, 55);
    doc.text(`Transaction ID: ${transactionId}`, 20, 62);
    doc.text(`Payment Mode: ${paymentMethod}`, 20, 69);
    if (razorpayPaymentId) {
        doc.text(`Razorpay ID: ${razorpayPaymentId}`, 20, 76);
    }

    // Delivery Address
    doc.setFontSize(14);
    doc.text('Delivery Address:', 20, 85);
    doc.setFontSize(10);
    const addr = shippingAddress;
    doc.text([
        addr.name || 'N/A',
        addr.phone || '',
        addr.addressLine1 || '',
        addr.addressLine2 || '',
        `${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}`
    ].filter(Boolean), 20, 92);

    // Products Table
    const tableData = items.map(item => [
        item.products?.name || item.product?.name || item.name || 'Product',
        item.size || '-',
        item.quantity || 0,
        `INR ${(item.price || 0).toFixed(2)}`,
        `INR ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}`
    ]);

    autoTable(doc, {
        startY: 125,
        head: [['Product', 'Size', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [139, 21, 56] }
    });

    // Total
    const finalY = (doc.lastAutoTable?.finalY || 125) + 10;
    doc.setFontSize(14);
    doc.text(`Total Amount: INR ${parseFloat(subtotal).toFixed(2)}`, pageWidth - 20, finalY, { align: 'right' });

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for shopping with AADAIUDAI!', pageWidth / 2, finalY + 30, { align: 'center' });

    doc.save(`Invoice_${order.orderId}.pdf`);
};
