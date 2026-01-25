export function getAnalyzeActionPrompt(card, summary) {
  return `You are an environmental impact analyst. Analyze the following sustainability action and calculate its environmental impact.

Action Category: ${card.category}
Action Type: ${card.name}
Action Description: ${card.description}
User's Summary: ${summary}

Think step by step:
1. Identify what baseline activity was avoided or what sustainable alternative was used
2. Estimate quantities from the user's description (distance, time, amount, etc.)
3. Calculate each metric using these conversion factors:
   - Driving: ~0.21 kg CO2 per km, ~0.08 kWh per km
   - Meat meal: ~3-6 kg CO2 vs plant-based meal
   - Shower: ~10 liters per minute, ~0.05 kWh per liter for heating
   - Lights: ~0.06 kWh per bulb-hour
   - Plastic bags: ~0.04 kg CO2 per bag
   - Local vs imported food: ~0.5-2 kg CO2 per kg of food
4. Estimate money saved based on typical costs

Respond with ONLY valid JSON in this exact format (no markdown, no explanation outside JSON):
{
  "metrics": {
    "co2Saved": <number in kg>,
    "energySaved": <number in kWh>,
    "waterSaved": <number in liters>,
    "moneySaved": <number in dollars>
  },
  "reasoning": "<brief 1-2 sentence explanation of how you calculated these values>"
}

If you cannot reasonably estimate a metric, use 0. Be conservative in your estimates.`
}
