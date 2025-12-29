import nodemailer, { Transporter } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host) {
    throw new Error('SMTP_HOST is not configured');
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true',
    auth: user && pass ? { user, pass } : undefined,
  });

  return cachedTransporter;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const from = process.env.EMAIL_FROM;

  if (!from) {
    throw new Error('EMAIL_FROM is not configured');
  }

  const transporter = getTransporter();

  await transporter.sendMail({
    from,
    ...options,
  });
}

export async function sendOTPEmail(email: string, otpCode: string): Promise<void> {
  const subject = 'Your OTP Code - Dastkar Rugs';
  const text = `Your OTP code is: ${otpCode}. This code will expire in 1 minute.`;
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your OTP Code - Dastkar Rugs</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafafa; line-height: 1.6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fafafa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 8px 32px rgba(30, 23, 23, 0.16);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #1e1717; padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 600; letter-spacing: 2px;">DASTKAR</h1>
              <p style="margin: 10px 0 0 0; color: #a8a8a8; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Premium Handmade Rugs</p>
            </td>
          </tr>

          <!-- OTP Content -->
          <tr>
            <td style="padding: 40px; text-align: center;">
              <h2 style="margin: 0 0 20px 0; color: #1e1717; font-size: 24px; font-weight: 600;">Your OTP Code</h2>
              <p style="margin: 0 0 30px 0; color: #4a4a4a; font-size: 16px;">
                Hello,<br>
                Your OTP code for Dastkar Rugs is:
              </p>
              
              <!-- OTP Code Box -->
              <div style="background-color: #f5f5f5; border: 3px solid #1e1717; border-radius: 8px; padding: 30px; margin: 30px 0; display: inline-block;">
                <h2 style="margin: 0; font-size: 48px; letter-spacing: 12px; color: #1e1717; font-weight: 700; font-family: 'Courier New', monospace;">${otpCode}</h2>
              </div>
              
              <p style="margin: 30px 0 0 0; color: #6a6a6a; font-size: 14px;">
                This code will expire in <strong style="color: #1e1717;">1 minute</strong>.
              </p>
              <p style="margin: 20px 0 0 0; color: #6a6a6a; font-size: 14px;">
                If you did not request this code, please ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1e1717; padding: 30px 40px; text-align: center;">
              <p style="margin: 0 0 15px 0; color: #a8a8a8; font-size: 14px;">
                Thank you for using Dastkar Rugs!
              </p>
              <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 600;">
                — Dastkar Rugs Team
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  await sendEmail({ to: email, subject, text, html });
}

interface OrderDeliveredEmailData {
  orderId: string;
  username: string;
  email: string;
  trackingNumber: string;
  items: Array<{
    title: string;
    image: string;
    size?: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  totalPrice: number;
  shippingFee: number;
  currency: string;
  paymentMethod: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  phoneNumber?: string;
  createdAt: Date;
}

export async function sendOrderDeliveredEmail(orderData: OrderDeliveredEmailData): Promise<void> {
  const subject = 'Your Order Has Been Delivered - Dastkar Rugs';
  
  // Format currency - Convert from paisa/cents to rupees for proper display
  const formatCurrency = (amount: number) => {
    // Prices are stored in paisa/cents (smallest unit), convert to rupees
    // Divide by 100 to get rupees
    const rupees = amount / 100;
    
    // Format as whole number with commas (PKR doesn't use decimal places in practice)
    // Use toLocaleString for proper comma formatting
    return `${orderData.currency} ${Math.round(rupees).toLocaleString('en-US')}`;
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Build address string
  const addressParts = [
    orderData.address,
    orderData.city,
    orderData.country,
    orderData.postalCode,
  ].filter(Boolean);
  const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Not provided';

  // Get frontend URL from environment variable
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const ordersPageUrl = `${frontendUrl}/orders`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Delivered - Dastkar Rugs</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafafa; line-height: 1.6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fafafa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 8px 32px rgba(30, 23, 23, 0.16);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #1e1717; padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 600; letter-spacing: 2px;">DASTKAR</h1>
              <p style="margin: 10px 0 0 0; color: #a8a8a8; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Premium Handmade Rugs</p>
            </td>
          </tr>

          <!-- Success Banner -->
          <tr>
            <td style="background-color: #f5f5f5; padding: 30px 40px; text-align: center; border-bottom: 3px solid #1e1717;">
              <div style="display: inline-block; background-color: #1e1717; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                ✓ Order Delivered
              </div>
              <p style="margin: 20px 0 0 0; color: #4a4a4a; font-size: 16px;">
                Great news! Your order has been successfully delivered.<br>
                You can received your order within 2-3 working days.
              </p>
            </td>
          </tr>

          <!-- Order Details -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #1e1717; font-size: 24px; font-weight: 600;">Order Details</h2>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                    <span style="color: #6a6a6a; font-size: 14px;">Order ID:</span>
                    <span style="color: #1e1717; font-size: 14px; font-weight: 600; margin-left: 10px;">${orderData.orderId}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                    <span style="color: #6a6a6a; font-size: 14px;">Tracking Number:</span>
                    <span style="color: #1e1717; font-size: 14px; font-weight: 600; margin-left: 10px;">${orderData.trackingNumber}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                    <span style="color: #6a6a6a; font-size: 14px;">Order Date:</span>
                    <span style="color: #1e1717; font-size: 14px; font-weight: 600; margin-left: 10px;">${formatDate(orderData.createdAt)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                    <span style="color: #6a6a6a; font-size: 14px;">Payment Method:</span>
                    <span style="color: #1e1717; font-size: 14px; font-weight: 600; margin-left: 10px; text-transform: capitalize;">${orderData.paymentMethod === 'pay_at_location' ? 'Pay at Location' : orderData.paymentMethod === 'online' ? 'Online Payment' : orderData.paymentMethod}</span>
                  </td>
                </tr>
                ${orderData.phoneNumber ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                    <span style="color: #6a6a6a; font-size: 14px;">Phone:</span>
                    <span style="color: #1e1717; font-size: 14px; font-weight: 600; margin-left: 10px;">${orderData.phoneNumber}</span>
                  </td>
                </tr>
                ` : ''}
              </table>

              <!-- Shipping Address -->
              <div style="background-color: #fafafa; padding: 20px; border-radius: 6px; margin-bottom: 30px; border-left: 4px solid #1e1717;">
                <h3 style="margin: 0 0 10px 0; color: #1e1717; font-size: 16px; font-weight: 600;">Shipping Address</h3>
                <p style="margin: 0; color: #4a4a4a; font-size: 14px; line-height: 1.8;">
                  ${orderData.username}<br>
                  ${fullAddress}
                </p>
              </div>

              <!-- Order Items -->
              <h3 style="margin: 0 0 20px 0; color: #1e1717; font-size: 18px; font-weight: 600;">Order Items</h3>
              ${orderData.items.map((item, index) => `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px; background-color: #fafafa; border-radius: 6px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td width="100" style="padding-right: 20px; vertical-align: top;">
                          <img src="${item.image}" alt="${item.title}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e5e5;" />
                        </td>
                        <td style="vertical-align: top;">
                          <h4 style="margin: 0 0 8px 0; color: #1e1717; font-size: 16px; font-weight: 600;">${item.title}</h4>
                          ${item.size ? `<p style="margin: 0 0 8px 0; color: #6a6a6a; font-size: 14px;">Size: ${item.size}</p>` : ''}
                          <p style="margin: 0 0 8px 0; color: #6a6a6a; font-size: 14px;">Quantity: ${item.quantity}</p>
                          <p style="margin: 0; color: #1e1717; font-size: 16px; font-weight: 600;">${formatCurrency(item.lineTotal)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              `).join('')}

              <!-- Order Summary -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 30px; border-top: 2px solid #e5e5e5; padding-top: 20px;">
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #6a6a6a; font-size: 14px;">Subtotal:</span>
                    <span style="color: #1e1717; font-size: 14px; font-weight: 600; float: right;">${formatCurrency(orderData.totalPrice - orderData.shippingFee)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #6a6a6a; font-size: 14px;">Shipping Fee:</span>
                    <span style="color: #1e1717; font-size: 14px; font-weight: 600; float: right;">${formatCurrency(orderData.shippingFee)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-top: 2px solid #1e1717;">
                    <span style="color: #1e1717; font-size: 18px; font-weight: 600;">Total:</span>
                    <span style="color: #1e1717; font-size: 18px; font-weight: 600; float: right;">${formatCurrency(orderData.totalPrice)}</span>
                  </td>
                </tr>
              </table>

              <!-- View Orders Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 30px;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${ordersPageUrl}" style="display: inline-block; background-color: #1e1717; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; transition: background-color 0.3s ease;">
                      View My Orders
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1e1717; padding: 30px 40px; text-align: center;">
              <p style="margin: 0 0 15px 0; color: #a8a8a8; font-size: 14px;">
                Thank you for shopping with Dastkar Rugs!
              </p>
              <p style="margin: 0; color: #a8a8a8; font-size: 12px;">
                If you have any questions or concerns, please don't hesitate to contact us.
              </p>
              <p style="margin: 20px 0 0 0; color: #ffffff; font-size: 14px; font-weight: 600;">
                — Dastkar Rugs Team
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Your Order Has Been Delivered - Dastkar Rugs

Great news! Your order has been successfully delivered.
You can received your order within 2-3 working days.

Order Details:
- Order ID: ${orderData.orderId}
- Tracking Number: ${orderData.trackingNumber}
- Order Date: ${formatDate(orderData.createdAt)}
- Payment Method: ${orderData.paymentMethod === 'pay_at_location' ? 'Pay at Location' : orderData.paymentMethod === 'online' ? 'Online Payment' : orderData.paymentMethod}
${orderData.phoneNumber ? `- Phone: ${orderData.phoneNumber}` : ''}

Shipping Address:
${orderData.username}
${fullAddress}

Order Items:
${orderData.items.map((item, index) => `
${index + 1}. ${item.title}${item.size ? ` (Size: ${item.size})` : ''}
   Quantity: ${item.quantity}
   Price: ${formatCurrency(item.lineTotal)}
`).join('')}

Order Summary:
Subtotal: ${formatCurrency(orderData.totalPrice - orderData.shippingFee)}
Shipping Fee: ${formatCurrency(orderData.shippingFee)}
Total: ${formatCurrency(orderData.totalPrice)}

Thank you for shopping with Dastkar Rugs!
If you have any questions or concerns, please don't hesitate to contact us.

— Dastkar Rugs Team
  `;

  await sendEmail({ 
    to: orderData.email, 
    subject, 
    text, 
    html 
  });
}

interface OrderConfirmationEmailData {
  orderId: string;
  username: string;
  email: string;
  items: Array<{
    title: string;
    image: string;
    size?: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  totalPrice: number;
  shippingFee: number;
  currency: string;
  paymentMethod: string;
  createdAt: Date;
}

export async function sendOrderConfirmationEmail(orderData: OrderConfirmationEmailData): Promise<void> {
  const subject = 'Order Confirmation - Dastkar Rugs';
  
  // Format currency - Convert from paisa/cents to rupees
  const formatCurrency = (amount: number) => {
    const rupees = amount / 100;
    return `${orderData.currency} ${Math.round(rupees).toLocaleString('en-US')}`;
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get frontend URL
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const ordersPageUrl = `${frontendUrl}/orders`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - Dastkar Rugs</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafafa; line-height: 1.6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fafafa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 8px 32px rgba(30, 23, 23, 0.16);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #1e1717; padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 600; letter-spacing: 2px;">DASTKAR</h1>
              <p style="margin: 10px 0 0 0; color: #a8a8a8; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Premium Handmade Rugs</p>
            </td>
          </tr>

          <!-- Confirmation Banner -->
          <tr>
            <td style="background-color: #f5f5f5; padding: 30px 40px; text-align: center; border-bottom: 3px solid #1e1717;">
              <div style="display: inline-block; background-color: #1e1717; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                ✓ Order Confirmed
              </div>
              <p style="margin: 20px 0 0 0; color: #4a4a4a; font-size: 16px;">
                Thank you for your order!<br>
                Your order has been confirmed and is being processed.
              </p>
            </td>
          </tr>

          <!-- Order Summary -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #1e1717; font-size: 24px; font-weight: 600;">Order Summary</h2>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                    <span style="color: #6a6a6a; font-size: 14px;">Order ID:</span>
                    <span style="color: #1e1717; font-size: 14px; font-weight: 600; margin-left: 10px;">${orderData.orderId}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                    <span style="color: #6a6a6a; font-size: 14px;">Order Date:</span>
                    <span style="color: #1e1717; font-size: 14px; font-weight: 600; margin-left: 10px;">${formatDate(orderData.createdAt)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                    <span style="color: #6a6a6a; font-size: 14px;">Payment Method:</span>
                    <span style="color: #1e1717; font-size: 14px; font-weight: 600; margin-left: 10px; text-transform: capitalize;">${orderData.paymentMethod === 'pay_at_location' ? 'Pay at Location' : orderData.paymentMethod === 'online' ? 'Online Payment' : orderData.paymentMethod}</span>
                  </td>
                </tr>
              </table>

              <!-- Order Items -->
              <h3 style="margin: 0 0 20px 0; color: #1e1717; font-size: 18px; font-weight: 600;">Order Items</h3>
              ${orderData.items.map((item, index) => `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px; background-color: #fafafa; border-radius: 6px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td width="100" style="padding-right: 20px; vertical-align: top;">
                          <img src="${item.image}" alt="${item.title}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e5e5;" />
                        </td>
                        <td style="vertical-align: top;">
                          <h4 style="margin: 0 0 8px 0; color: #1e1717; font-size: 16px; font-weight: 600;">${item.title}</h4>
                          ${item.size ? `<p style="margin: 0 0 8px 0; color: #6a6a6a; font-size: 14px;">Size: ${item.size}</p>` : ''}
                          <p style="margin: 0 0 8px 0; color: #6a6a6a; font-size: 14px;">Quantity: ${item.quantity}</p>
                          <p style="margin: 0; color: #1e1717; font-size: 16px; font-weight: 600;">${formatCurrency(item.lineTotal)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              `).join('')}

              <!-- Order Total -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 30px; border-top: 2px solid #e5e5e5; padding-top: 20px;">
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #6a6a6a; font-size: 14px;">Subtotal:</span>
                    <span style="color: #1e1717; font-size: 14px; font-weight: 600; float: right;">${formatCurrency(orderData.totalPrice - orderData.shippingFee)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #6a6a6a; font-size: 14px;">Shipping Fee:</span>
                    <span style="color: #1e1717; font-size: 14px; font-weight: 600; float: right;">${formatCurrency(orderData.shippingFee)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-top: 2px solid #1e1717;">
                    <span style="color: #1e1717; font-size: 18px; font-weight: 600;">Total:</span>
                    <span style="color: #1e1717; font-size: 18px; font-weight: 600; float: right;">${formatCurrency(orderData.totalPrice)}</span>
                  </td>
                </tr>
              </table>

              <!-- View Orders Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 30px;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${ordersPageUrl}" style="display: inline-block; background-color: #1e1717; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; transition: background-color 0.3s ease;">
                      View My Orders
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1e1717; padding: 30px 40px; text-align: center;">
              <p style="margin: 0 0 15px 0; color: #a8a8a8; font-size: 14px;">
                Thank you for shopping with Dastkar Rugs!
              </p>
              <p style="margin: 0; color: #a8a8a8; font-size: 12px;">
                We will notify you once your order is ready for delivery.
              </p>
              <p style="margin: 20px 0 0 0; color: #ffffff; font-size: 14px; font-weight: 600;">
                — Dastkar Rugs Team
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Order Confirmation - Dastkar Rugs

Thank you for your order!
Your order has been confirmed and is being processed.

Order Summary:
- Order ID: ${orderData.orderId}
- Order Date: ${formatDate(orderData.createdAt)}
- Payment Method: ${orderData.paymentMethod === 'pay_at_location' ? 'Pay at Location' : orderData.paymentMethod === 'online' ? 'Online Payment' : orderData.paymentMethod}

Order Items:
${orderData.items.map((item, index) => `
${index + 1}. ${item.title}${item.size ? ` (Size: ${item.size})` : ''}
   Quantity: ${item.quantity}
   Price: ${formatCurrency(item.lineTotal)}
`).join('')}

Order Summary:
Subtotal: ${formatCurrency(orderData.totalPrice - orderData.shippingFee)}
Shipping Fee: ${formatCurrency(orderData.shippingFee)}
Total: ${formatCurrency(orderData.totalPrice)}

Thank you for shopping with Dastkar Rugs!
We will notify you once your order is ready for delivery.

— Dastkar Rugs Team
  `;

  await sendEmail({ 
    to: orderData.email, 
    subject, 
    text, 
    html 
  });
}

