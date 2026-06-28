import { formatPhoneNumber } from "@/lib/utils/phone";

export interface SendWhatsAppParams {
  to: string;
  type: "text" | "image" | "document";
  text?: { body: string };
  image?: { link: string; caption?: string };
  document?: { link?: string; id?: string; filename: string; caption?: string };
}

/**
 * Formats a phone number for the WhatsApp API.
 * WhatsApp API requires phone numbers to have a country code and no leading '+', spaces, or dashes.
 * If it's a 10-digit number, we default to India (+91) code '91'.
 */
export function formatWhatsAppNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  return cleaned;
}

/**
 * Sends a message via Meta's WhatsApp Business Cloud API.
 * Requires WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID in environment variables.
 */
export async function sendWhatsAppMessage(params: SendWhatsAppParams) {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token) {
    throw new Error("WHATSAPP_API_TOKEN is not configured in .env.local");
  }
  if (!phoneNumberId) {
    throw new Error("WHATSAPP_PHONE_NUMBER_ID is not configured in .env.local");
  }

  const to = formatWhatsAppNumber(params.to);
  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  const payload: Record<string, any> = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: params.type,
  };

  if (params.type === "text" && params.text) {
    payload.text = {
      preview_url: false,
      body: params.text.body,
    };
  } else if (params.type === "image" && params.image) {
    payload.image = {
      link: params.image.link,
      caption: params.image.caption,
    };
  } else if (params.type === "document" && params.document) {
    payload.document = {
      filename: params.document.filename,
      caption: params.document.caption,
    };
    if (params.document.id) {
      payload.document.id = params.document.id;
    } else if (params.document.link) {
      payload.document.link = params.document.link;
    }
  } else {
    throw new Error(`Invalid or missing payload details for type: ${params.type}`);
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("WhatsApp API error payload:", payload);
    console.error("WhatsApp API error response:", data);
    const errorDetails = data.error?.error_data?.details || data.error?.message || "Unknown Meta API error";
    throw new Error(`${errorDetails} (Code: ${data.error?.code || response.status})`);
  }

  return {
    success: true,
    messageId: data.messages?.[0]?.id,
    data,
  };
}
