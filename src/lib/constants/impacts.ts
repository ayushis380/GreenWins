// EPA and scientific data for impact calculations
export const EQUIVALENCIES = {
  co2PerMile: 0.404,           // kg CO2 per car mile
  co2PerTreeYear: 21.8,        // kg CO2 absorbed per tree per year
  co2PerPhoneCharge: 0.008,    // kg CO2 per phone charge
  waterPerShower: 60,          // liters per 10-min shower
  kwhPerLightHour: 0.06,       // kWh per 60W bulb hour
};

export const FUN_FACTS = [
  "A single tree absorbs about 22kg of CO2 per year - you're on your way to becoming a mini forest!",
  "The average household wastes about 180 gallons of water per week - every drop you save matters!",
  "If everyone in the US skipped one meat meal per week, it would be like taking 7.6 million cars off the road!",
  "Line drying clothes for a year saves the equivalent energy of driving from LA to NYC!",
  "Public transport uses about 50% less energy per passenger mile than private cars!",
  "Unplugging devices when not in use can save up to 10% on your electricity bill!",
  "A reusable bag used for one year replaces 500+ plastic bags!",
  "Cold water washing uses 90% less energy than hot water washing!",
  "Composting diverts 30% of household waste from landfills!",
  "A 5-minute shorter shower saves enough water to fill 50 drinking glasses!",
];

export const ENCOURAGEMENTS = [
  "Amazing work! Every action counts!",
  "You're making waves of positive change!",
  "Small steps, big impact - keep it up!",
  "The planet thanks you for your effort!",
  "You're a sustainability superstar!",
  "Your daily choices are shaping a greener future!",
  "Consistency is key, and you're nailing it!",
  "Each stamp is a step toward a healthier planet!",
];

export const calculateEquivalencies = (co2Kg: number, waterLiters: number, energyKwh: number) => {
  return {
    milesNotDriven: Math.round(co2Kg / EQUIVALENCIES.co2PerMile),
    treesPlanted: Number((co2Kg / EQUIVALENCIES.co2PerTreeYear).toFixed(2)),
    phonesCharged: Math.round(co2Kg / EQUIVALENCIES.co2PerPhoneCharge),
    showersSkipped: Math.round(waterLiters / EQUIVALENCIES.waterPerShower),
    lightsOffHours: Math.round(energyKwh / EQUIVALENCIES.kwhPerLightHour),
  };
};
