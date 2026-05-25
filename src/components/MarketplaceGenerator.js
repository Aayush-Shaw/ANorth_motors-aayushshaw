import React, { useState } from 'react';
import { Copy, CheckCircle, Facebook, Car } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MarketplaceGenerator({ vehicle }) {
  const [copied, setCopied] = useState(false);

  if (!vehicle) return null;

  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model} - Pristine Condition!`;
  
  const generateTemplate = () => {
    return `🔥 ${title} 🔥

Get behind the wheel of this beautiful ${vehicle.year} ${vehicle.make} ${vehicle.model}! 
Perfect for Alberta roads and ready for a new home.

✨ KEY DETAILS:
• Mileage: ${vehicle.mileage ? vehicle.mileage.toLocaleString() + ' km' : 'Low Mileage'}
• Transmission: ${vehicle.transmission || 'Automatic'}
• Drivetrain: ${vehicle.drivetrain || 'AWD/4WD'}
• Exterior: ${vehicle.exterior_color || 'Premium'}

🏆 WHY BUY FROM AUTONORTH MOTORS?
✅ Zero Dealer Fees - The price you see is the price you pay!
✅ 150-Point Inspection Completed
✅ Financing Available for ALL Credit Types (Approval in 10 mins!)
✅ Trade-ins Welcome - Get top dollar for your current ride.

💰 PRICE: $${vehicle.price ? vehicle.price.toLocaleString() : 'Call for Price'}
📍 LOCATION: 9104 91 St NW, Edmonton, AB

Message us right here on Marketplace to book a test drive or ask any questions!
Or call/text: 825-605-5050

#Edmonton #Alberta #UsedCars #${vehicle.make} #${vehicle.model} #AutoNorthMotors #CarSale #YEGcars`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateTemplate());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#111] border border-white/10 rounded p-4 mt-4 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#1877F2]/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Facebook size={18} className="text-[#1877F2]" />
          <h3 className="text-white font-heading text-sm uppercase tracking-wider font-bold">Marketplace Ready Post</h3>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all"
        >
          {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy Post'}
        </button>
      </div>

      <div className="bg-black/50 p-4 rounded border border-white/5 font-body text-white/70 text-xs whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">
        {generateTemplate()}
      </div>
    </div>
  );
}
