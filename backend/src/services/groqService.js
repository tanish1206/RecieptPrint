import Groq from 'groq-sdk';

/**
 * Sanitizes input string to prevent injection by removing HTML tags and special characters.
 * @param {string} input 
 * @returns {string}
 */
export function sanitizeInput(input) {
  if (!input || typeof input !== 'string') return '';
  // Strip HTML tags
  let sanitized = input.replace(/<\/?[^>]+(>|$)/g, '');
  // Keep alphanumeric, spaces, and basic punctuation
  sanitized = sanitized.replace(/[^\w\s\-\.\,\/\:\(\)\&\$\%]/g, '');
  return sanitized.trim();
}

/**
 * Analyzes a receipt image using Groq's Llama 3.2 Vision model.
 * @param {string} base64Image Base64-encoded image data.
 * @param {string} mimeType Mime type (image/jpeg or image/png).
 * @returns {Promise<object>} Parsed receipt data structure.
 */
export async function analyzeReceiptWithGroq(base64Image, mimeType) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured on the server.');
  }

  const apiKey = process.env.GROQ_API_KEY;
  const isXai = apiKey.startsWith('xai-');

  const groq = new Groq({
    apiKey: apiKey,
    ...(isXai ? { baseURL: 'https://api.x.ai/v1' } : {})
  });

  const prompt = `Analyze the attached receipt image and extract details about the transaction and the items purchased.
Extract the following:
1. The store or merchant name.
2. The date of the transaction (in YYYY-MM-DD format, fallback if not found).
3. The total purchase amount as a number.
4. An array of items purchased, where each item contains:
   - name: Cleaned name of the item. Strip out internal POS codes, quantity descriptors from the name itself (e.g. rename "BASMATI RICE 5KG" to "Basmati Rice"), prices, or receipt noise. Keep English or localized Hindi names.
   - quantity: Number of units or weight amount. (e.g. if the item is "Sugar 2 kg", extract 2 as the quantity). Default to 1.
   - unit: The unit of measurement (e.g. "kg", "g", "litre", "ml", "pcs", "pack"). If it is a count of items, use "pcs". Default to "pcs".
   - price: The unit or total price for this item as a number.

Return ONLY valid JSON. No commentary, no markdown fences, no preamble.
Use exactly this JSON schema:
{
  "storeName": "Merchant Name",
  "receiptDate": "YYYY-MM-DD",
  "totalAmount": 0.00,
  "items": [
    {
      "name": "Cleaned Item Name",
      "quantity": 1.0,
      "unit": "pcs",
      "price": 0.00
    }
  ]
}`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      model: isXai ? 'grok-2-vision-1212' : 'llama-3.2-11b-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const rawResponse = chatCompletion.choices[0]?.message?.content;
    if (!rawResponse) {
      throw new Error('Groq AI returned an empty response.');
    }

    // Rule 8: Parse response safely. Wrap JSON.parse() in try/catch.
    try {
      const parsedData = JSON.parse(rawResponse);
      
      // Ensure the structure is correct
      return {
        storeName: sanitizeInput(parsedData.storeName) || 'Unknown Store',
        receiptDate: sanitizeInput(parsedData.receiptDate) || new Date().toISOString().split('T')[0],
        totalAmount: parseFloat(parsedData.totalAmount) || 0.0,
        items: Array.isArray(parsedData.items)
          ? parsedData.items.map(item => ({
              name: sanitizeInput(item.name) || 'Unknown Item',
              quantity: parseFloat(item.quantity) || 1,
              unit: sanitizeInput(item.unit) || 'pcs',
              price: parseFloat(item.price) || 0.0,
            }))
          : [],
      };
    } catch (parseError) {
      console.error('Failed to parse Groq AI response as JSON:', rawResponse, parseError);
      throw new Error('Failed to parse receipt data from AI response.');
    }
  } catch (error) {
    console.error('Error in analyzeReceiptWithGroq:', error.message);
    // Rule 5: Never expose internal error messages to the client.
    throw new Error('Receipt analysis failed due to an upstream server error.');
  }
}
