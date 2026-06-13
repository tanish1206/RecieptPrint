import express from 'express';
import { handleFileUpload } from '../middleware/upload.js';
import { analyzeReceiptWithGroq } from '../services/groqService.js';
import { calculateEmissions } from '../utils/carbonMapper.js';

const router = express.Router();

/**
 * Route: POST /api/analyze
 * Desc: Receives a receipt file, validates it, sends it to Groq for OCR extraction,
 *       maps the extracted items to the carbon database, and returns calculations and suggestions.
 */
router.post('/', handleFileUpload, async (req, res) => {
  try {
    const file = req.file;

    // Rule 23: PDF files cannot be sent to Groq directly.
    // If the backend receives application/pdf, it must reject or inform the client to rasterize.
    if (file.mimetype === 'application/pdf') {
      return res.status(400).json({
        error: 'PDF files must be rasterized to an image client-side before sending to the AI.'
      });
    }

    const base64Image = file.buffer.toString('base64');
    
    // Call the Groq service (AI extraction)
    // Rule 6: Use exactly ONE Groq API call per receipt upload
    // Rule 8: Safe parsing is handled within the service
    const extractedData = await analyzeReceiptWithGroq(base64Image, file.mimetype);

    // Rule 9: Carbon mapping happens in OUR code after extraction, not inside the Groq prompt
    let totalEmissions = 0.0;
    const itemsWithEmissions = extractedData.items.map((item) => {
      const calculation = calculateEmissions(item.name, item.quantity, item.unit);
      totalEmissions += calculation.co2e;
      
      return {
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        category: calculation.matchedItem.category,
        co2e: calculation.co2e,
        isFallback: calculation.matchedItem.isFallback,
        suggestions: calculation.matchedItem.suggestions || []
      };
    });

    // Extract all unique suggestions from the mapped items
    const swapSuggestions = [];
    itemsWithEmissions.forEach((item) => {
      if (item.suggestions && item.suggestions.length > 0) {
        item.suggestions.forEach((suggestion) => {
          swapSuggestions.push({
            originalItem: item.name,
            originalCo2e: item.co2e,
            category: item.category,
            swapTo: suggestion.name,
            swapCo2e: Math.round((item.quantity * (suggestion.co2_per_kg || 0.0)) * 100) / 100,
            reason: suggestion.reason
          });
        });
      }
    });

    // Compile personalized insights based on carbon footprint
    const insights = [];
    const highEmittingItems = itemsWithEmissions
      .filter((i) => i.co2e > 2.0)
      .sort((a, b) => b.co2e - a.co2e);

    if (highEmittingItems.length > 0) {
      insights.push(`Your highest carbon impact comes from "${highEmittingItems[0].name}" (${highEmittingItems[0].co2e} kg CO₂e).`);
    }

    // Category breakdown
    const categoryTotals = {};
    itemsWithEmissions.forEach((i) => {
      categoryTotals[i.category] = (categoryTotals[i.category] || 0) + i.co2e;
    });

    const highestCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    if (highestCategory) {
      insights.push(`The "${highestCategory[0]}" category contributed the most to this trip, at ${Math.round(highestCategory[1] * 10) / 10} kg CO₂e.`);
    }

    // Add a localized impact comparison
    // E.g. 10 kg CO2e is equivalent to driving X km in an average Indian passenger car (approx 0.12 kg CO2e per km)
    // Or charging X smartphones (approx 0.008 kg CO2e per charge)
    const totalEmissionsRounded = Math.round(totalEmissions * 100) / 100;
    const drivingEquivalentKm = Math.round((totalEmissionsRounded / 0.12) * 10) / 10;
    const smartphoneCharges = Math.round(totalEmissionsRounded / 0.008);

    const impactComparison = {
      drivingEquivalentKm,
      smartphoneCharges,
      text: `Your grocery basket footprint of ${totalEmissionsRounded} kg CO₂e is equivalent to driving a petrol car for ${drivingEquivalentKm} km or charging ${smartphoneCharges} smartphones.`
    };

    res.status(200).json({
      storeName: extractedData.storeName,
      receiptDate: extractedData.receiptDate,
      totalAmount: extractedData.totalAmount,
      items: itemsWithEmissions,
      totalEmissions: totalEmissionsRounded,
      swapSuggestions,
      insights,
      impactComparison
    });

  } catch (error) {
    console.error('Error during receipt analysis:', error);
    
    const msg = error.message || '';
    if (msg.includes('credits') || msg.includes('API key') || msg.includes('Grok')) {
      return res.status(400).json({ error: msg });
    }

    // Rule 5: Never expose internal error messages to the client. Log server-side.
    res.status(500).json({
      error: 'An error occurred while analyzing the receipt. Please try again.'
    });
  }
});

export default router;
