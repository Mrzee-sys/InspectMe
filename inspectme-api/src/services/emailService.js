const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");

let transporter;

function buildInspectionPdfBuffer({ inspection, siteName, locationName, employeeName }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("InspectMe Inspection Report", { align: "left" });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Inspection ID: ${inspection._id}`);
    doc.text(`Date: ${inspection.date}`);
    doc.text(`Time: ${inspection.time}`);
    doc.text(`Period: ${inspection.period}`);
    doc.text(`Status: ${inspection.status}`);
    doc.text(`Site: ${siteName}`);
    doc.text(`Location: ${locationName}`);
    doc.text(`Inspector: ${employeeName}`);
    doc.text(`Type: ${inspection.type}`);
    doc.moveDown();

    doc.fontSize(13).text("Responses", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);

    inspection.answers.forEach((answer, index) => {
      doc.text(`${index + 1}. ${answer.question}`);
      doc.text(`Result: ${answer.result}`);
      if (answer.comment) {
        doc.text(`Comment: ${answer.comment}`);
      }
      if (answer.photoUrl) {
        doc.text("Photo attached in submission payload.");
      }
      doc.moveDown(0.5);
    });

    doc.end();
  });
}

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASSWORD
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          }
        : undefined,
  });

  return transporter;
}

async function sendViaEmailJs({ subject, text, inspection, siteName, locationName, employeeName }) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const userId = process.env.EMAILJS_PUBLIC_KEY;
  const accessToken = process.env.EMAILJS_PRIVATE_KEY;
  const toEmail = process.env.EMAIL_TO || "ShaunZurcher@gmail.com";

  if (!serviceId || !templateId || !userId) {
    throw new Error("EmailJS is selected but EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, or EMAILJS_PUBLIC_KEY is missing.");
  }

  const attachmentParamName = process.env.EMAILJS_ATTACHMENT_PARAM || "report_pdf";
  const filenameParamName = process.env.EMAILJS_ATTACHMENT_FILENAME_PARAM || "report_filename";
  const templateParams = {
    to_email: toEmail,
    subject,
    message: text,
    inspection_id: String(inspection?._id || ""),
    inspection_date: inspection?.date || "",
    inspection_time: inspection?.time || "",
    inspection_period: inspection?.period || "",
    inspection_status: inspection?.status || "",
    inspection_type: inspection?.type || "",
    site_name: siteName || "",
    location_name: locationName || "",
    inspector_name: employeeName || "",
  };

  if (inspection) {
    const pdfBuffer = await buildInspectionPdfBuffer({
      inspection,
      siteName,
      locationName,
      employeeName,
    });

    templateParams[attachmentParamName] = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;
    templateParams[filenameParamName] = `inspection-${inspection._id}.pdf`;
  }

  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: userId,
      accessToken,
      template_params: templateParams,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`EmailJS send failed: ${errorText}`);
  }

  return { attempted: true, sent: true };
}

async function sendInspectionSubmissionEmail({ subject, text, inspection, siteName, locationName, employeeName }) {
  const provider = (process.env.EMAIL_PROVIDER || "smtp").toLowerCase();

  if (provider === "emailjs") {
    return sendViaEmailJs({
      subject,
      text,
      inspection,
      siteName,
      locationName,
      employeeName,
    });
  }

  const to = process.env.EMAIL_TO || "ShaunZurcher@gmail.com";
  const from = process.env.SMTP_USER;

  if (!to || !from) {
    return { attempted: false, sent: false };
  }

  const mailer = getTransporter();
  const attachments = [];

  if (inspection) {
    const pdfBuffer = await buildInspectionPdfBuffer({
      inspection,
      siteName,
      locationName,
      employeeName,
    });

    attachments.push({
      filename: `inspection-${inspection._id}.pdf`,
      content: pdfBuffer,
      contentType: "application/pdf",
    });
  }

  await mailer.sendMail({
    from,
    to,
    subject,
    text,
    attachments,
  });

  return { attempted: true, sent: true };
}

module.exports = {
  sendInspectionSubmissionEmail,
};
