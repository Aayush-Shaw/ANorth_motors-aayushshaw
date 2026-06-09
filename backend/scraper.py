import httpx
import json
import logging
import asyncio
import re
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

ALGOLIA_APP_ID = "VBAFQME90B"
ALGOLIA_API_KEY = "650a66d4bf074b5de276a2ecb945bf80"
ALGOLIA_URL = f"https://{ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/*/queries"

def _sanitize(text):
    if not text: return ""
    text = re.sub(r'\s+', ' ', str(text)).strip()
    return re.sub(r'(?i)team\s*ford', 'AutoNorth', text)

class NeuralKnowledge:
    """
    NEURAL KNOWLEDGE ENGINE:
    Acts as a high-intelligence 'Local Brain' that mimics advanced LLMs using 
    semantic pattern matching and inventory-aware synthesis.
    """
    @staticmethod
    def extract_intent(msg: str):
        msg = msg.lower()
        patterns = {
            "GREETING": r"\b(hi|hello|hey|morning|good afternoon|howdy|greetings)\b",
            "INVENTORY_SEARCH": r"\b(looking for|have|stock|inventory|cars|trucks|suvs|autos|vehicles)\b",
            "FINANCE": r"\b(finance|credit|loan|approve|monthly|payments|rate|interest|down payment)\b",
            "CONTACT": r"\b(location|where|address|phone|number|contact|call|email)\b",
            "BOOKING": r"\b(book|schedule|test drive|view|visit|appointment)\b",
            "DEAL": r"\b(deal|best price|special|discount|offer|cheapest|lowest)\b",
            "CONFIRMATION": r"\b(yes|yeah|sure|ok|okay|please|book it|do it)\b"
        }
        for intent, pattern in patterns.items():
            if re.search(pattern, msg):
                return intent
        return "GENERAL"

    @staticmethod
    def analyze_inventory(msg: str, inventory: List[Dict]):
        msg = msg.lower()
        
        # Filter out $0 vehicles or placeholders
        clean_inv = [v for v in inventory if v.get('price', 0) > 100]
        if not clean_inv: clean_inv = inventory # Fallback if everything is $0
        
        makes = ["ford", "ram", "chevrolet", "toyota", "honda", "jeep", "dodge", "nissan", "hyundai", "kia", "bmw", "mercedes"]
        found_make = next((m for m in makes if m in msg), None)
        
        # Smart Type Mapping
        types = {
            "truck": ["truck", "pickup", "crew", "ext", "cab"],
            "suv": ["suv", "crossover", "utility", "sport"],
            "sedan": ["sedan", "coupe", "hardtop"],
            "van": ["van", "minivan"],
            "ev": ["electric", "ev", "lightning", "tesla"]
        }
        found_type = None
        type_keywords = []
        for k, aliases in types.items():
            if any(a in msg for a in aliases):
                found_type = k
                type_keywords = aliases
                break
        
        results = []
        if found_make:
            results = [v for v in clean_inv if found_make in v.get('make', '').lower()]
        
        if found_type:
            type_results = [v for v in clean_inv if any(kw in v.get('body_type', '').lower() or kw in v.get('title', '').lower() for kw in type_keywords)]
            results = [v for v in inventory if found_make in v.get('make', '').lower()]
        elif found_type:
            results = [v for v in inventory if found_type in v.get('body_type', '').lower() or found_type in v.get('title', '').lower()]
        
        if not results and inventory:
            results = sorted(inventory, key=lambda x: x.get('price', 999999))[:3]
            
        return results, found_make or found_type

    @staticmethod
    async def generate_response(msg: str, inventory: List[Dict], provider: str = "local", api_key: str = "", model: str = ""):
        """
        GENERATE RESPONSE:
        High-performance intelligence engine with multi-provider support 
        and deep Edmonton/Alberta location awareness.
        """
        intent = NeuralKnowledge.extract_intent(msg)
        results, entity = NeuralKnowledge.analyze_inventory(msg, inventory)
        
        # 1. LOCATION CONTEXT LAYER (Edmonton/Alberta specific)
        loc_context = "AutoNorth Motors is located at 9104 91 St NW, Edmonton, AB T6C 3N5. "
        winter_advice = "For Edmonton winters, we highly recommend AWD or 4WD vehicles. "
        
        # 2. LOCAL BRAIN (Priority Local Synthesis)
        if provider == "local" or not api_key:
            if intent == "GREETING":
                return "Welcome to AutoNorth Motors! I'm your AI Automotive Specialist. I'm connected to our live Edmonton inventory—are you searching for a specific make, looking for a deal, or interested in financing?"
            
            if intent == "CONTACT":
                return f"{loc_context}You can reach our sales floor directly at 825-605-5050. Would you like me to send these details to your phone?"
            
            if intent == "FINANCE":
                return "Our 'AutoNorth Credit Brain' analyzes your situation to find the lowest possible rates in Alberta. We specialize in all credit types—from perfect to rebuilding. Shall I start your application?"
            
            if intent == "DEAL":
                specials = [v for v in inventory if v.get('is_on_special')]
                if specials:
                    s = specials[0]
                    return f"I have a high-value deal right now: A {s.get('title')} originally priced higher, now available for ${s.get('price', 0):,.0f}. This is our top-tier special this week. Interest?"
                if inventory:
                    cheapest = sorted(inventory, key=lambda x: x.get('price', 0))[0]
                    return f"The best entry-point in our current inventory is the {cheapest.get('title')} for only ${cheapest.get('price', 0):,.0f}. It's a great balance of value and reliability."
                return "I'm checking our incoming manifest. We receive new inventory daily. What specifically should I keep an eye out for?"

            if intent == "BOOKING":
                return "I can secure a VIP viewing and test drive for you. Which day this week works best? I'll coordinate everything with a product specialist."

            if intent == "INVENTORY_SEARCH" or entity:
                if results:
                    top = results[0]
                    others = len(results) - 1
                    resp = f"I've analyzed our live stock: The **{top.get('title')}** (priced at **${top.get('price', 0):,.0f}**) perfectly matches your request. "
                    if others > 0:
                        resp += f"I also have {others} other similar models available. "
                    resp += "\n\nWould you like to see the full spec sheet or book a viewing at our Edmonton showroom?"
                    return resp
                return "I'm checking our incoming manifest. We receive new inventory daily. What specifically should I keep an eye out for?"

            return "I'm the AutoNorth Intelligence Engine. I can analyze our vehicle feed, explain financing options, or book your VIP test drive in Edmonton. How can I best serve you today?"

        # 3. GLOBAL BRAIN (AI Providers)
        # Context-aware prompt for AI providers
        v_context = json.dumps([{k: v for k, v in res.items() if k != '_id'} for res in results[:5]])
        system_prompt = f"""You are the AutoNorth Motors AI Specialist, an elite automotive concierge in Edmonton, Alberta.
        
        Current Intent: {intent}
        Location Context: {loc_context} {winter_advice}
        Relevant Inventory: {v_context}
        
        Instructions:
        - Be professional, helpful, and luxury-oriented.
        - Emphasize that we serve Edmonton, Sherwood Park, St. Albert, and the greater Alberta area.
        - Mention specific vehicle highlights (price, mileage, features) if they match the user's query.
        - ALWAYS use this link format for vehicles: [Year Make Model](/vehicle/ID).
        - Use markdown for bolding and tables. Always drive the user towards a test drive or call (825-605-5050).
        """

        # 3. OPENROUTER PROVIDER
        if provider == "openrouter" and api_key:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json", "HTTP-Referer": "https://autonorth.ca", "X-Title": "AutoNorth AI"},
                        json={"model": model or "openrouter/auto", "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": msg}]}
                    )
                    if resp.status_code == 200:
                        return resp.json()['choices'][0]['message']['content']
            except Exception as e:
                logger.error(f"OpenRouter exception: {str(e)}")

        # 4. CLAUDE PROVIDER
        if provider == "claude" and api_key:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(
                        "https://api.anthropic.com/v1/messages",
                        headers={"x-api-key": api_key, "anthropic-version": "2023-06-01", "content-type": "application/json"},
                        json={"model": model or "claude-3-haiku-20240307", "max_tokens": 1024, "system": system_prompt, "messages": [{"role": "user", "content": msg}]}
                    )
                    if resp.status_code == 200:
                        return resp.json()["content"][0]["text"]
            except Exception as e:
                logger.error(f"Claude exception: {str(e)}")

        # 5. GEMINI PROVIDER
        if provider == "gemini" and api_key:
            try:
                from google import genai
                client = genai.Client(api_key=api_key)
                response = client.models.generate_content(model=model or 'gemini-1.5-flash', contents=f"{system_prompt}\n\nUser Message: {msg}")
                return response.text
            except Exception as e:
                logger.error(f"Gemini exception: {str(e)}")

        return "I'm having trouble connecting to my cloud memory, but I'm still here to help! AutoNorth is located at 9104 91 St NW, Edmonton. Call us at 825-605-5050 for immediate assistance."


def _parse_teamford_vehicle(h: Dict) -> Dict[str, Any]:
    """Helper to parse a single vehicle from Algolia hit with robust field mapping."""
    # Robust Price Extraction
    price = 0
    price_fields = ["sort_price", "special_price", "list_price", "regular_price", "retail_price", "msrp"]
    for field in price_fields:
        val = h.get(field)
        if val:
            try:
                price = float(val)
                if price > 0: break
            except: continue
    
    if not price:
        pricing = h.get("pricing") or {}
        if isinstance(pricing, dict):
            price = float(pricing.get("sell_price") or pricing.get("list_price") or 0)

    # Robust Image Construction (Cloudinary)
    images = []
    # 1. Try photo_service_ids (Real photos)
    photo_ids = h.get("photo_service_ids") or []
    if isinstance(photo_ids, list) and photo_ids:
        # Base URL for Team Ford Cloudinary
        base_url = "https://res.cloudinary.com/kraft-apps/image/upload/c_fill,f_auto,fl_lossy,q_auto,w_1920/"
        images = [f"{base_url}{pid}" for pid in photo_ids]
    
    # 2. Fallback to images list
    if not images:
        images = [img.get("url") for img in h.get("images", []) if isinstance(img, dict) and img.get("url")]
    
    # 3. Final fallback to thumbnail
    if not images and h.get("thumbnail_url"):
        images = [h.get("thumbnail_url")]
    
    # Robust Identifiers
    vin = h.get("vin")
    stock = h.get("stock_number")
    
    # Mapping
    make = h.get("make_name") or h.get("make") or ""
    model = h.get("model_name") or h.get("model") or ""
    year = int(h.get("year") or 2024)
    trim = h.get("published_trim") or h.get("trim") or ""
    
    # Cleaner Title Generation
    # If trim is too long (contains features), truncate it
    clean_trim = trim
    if len(clean_trim) > 50:
        # Try to find the first part before a comma
        clean_trim = clean_trim.split(',')[0].strip()
    
    title = _sanitize(f"{year} {make} {model} {clean_trim}".strip())
    if not title or title == str(year):
        title = _sanitize(h.get("title") or f"{year} {make} {model}")

    # Build description from published_notes if available for better data quality
    description = h.get("published_notes") or h.get("description") or h.get("comments")
    if description:
        # Strip HTML tags
        description = re.sub('<[^<]+?>', '', description)
        description = _sanitize(description)
    else:
        description = f"Certified premium {year} {make} {model} available at AutoNorth Motors. Schedule your test drive today!"

    return {
        "vin": vin,
        "stock_number": stock,
        "title": title,
        "make": make,
        "model": model,
        "year": year,
        "price": price,
        "mileage": int(h.get("odometer") or h.get("mileage") or 0),
        "condition": (h.get("stock_type") or "used").lower(),
        "body_type": h.get("body_type_name") or h.get("body_style") or h.get("body_type_category"),
        "fuel_type": h.get("fuel_type_category") or h.get("fuel_type_name") or "Gas",
        "transmission": h.get("transmission_name") or h.get("transmission_desc") or "Automatic",
        "drivetrain": h.get("drive_type_name") or h.get("drive_type_desc") or "",
        "exterior_color": h.get("exterior_colour_name") or h.get("exterior_color"),
        "interior_color": h.get("interior_colour_name") or h.get("interior_color"),
        "engine": h.get("engine_description") or h.get("engine_config_name") or "",
        "description": description[:1500], # Keep it reasonable
        "features": [_sanitize(f.get("name")) for f in h.get("features", []) if isinstance(f, dict) and f.get("name")],
        "images": images,
        "status": "available",
        "source": "teamford_sync",
        "featured": h.get("is_featured", False),
        "is_on_special": h.get("is_on_special", False),
        "source_url": f"https://www.teamford.ca/vehicles/{h.get('slug')}" if h.get('slug') else ""
    }

async def scrape_teamford_inventory(limit: int = 2000) -> List[Dict[str, Any]]:
    """DEFINITIVE SYNC ENGINE: Captures vehicles from Team Ford live feed."""
    logger.info("Starting Team Ford Algolia Sync...")
    try:
        headers = {
            "x-algolia-api-key": ALGOLIA_API_KEY,
            "x-algolia-application-id": ALGOLIA_APP_ID,
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://www.teamford.ca/"
        }
        all_vehicles = []
        page = 0
        hits_per_page = 100 
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            while len(all_vehicles) < limit:
                logger.info(f"Fetching Algolia page {page}...")
                # Try site ID 34 (Team Ford)
                payload = {"requests": [{"indexName": "inventory", "params": f"filters=craft_site_ids%3A34&hitsPerPage={hits_per_page}&page={page}"}]}
                resp = await client.post(ALGOLIA_URL, json=payload, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                
                result = data.get("results", [{}])[0]
                hits = result.get("hits", [])
                nb_hits = result.get("nbHits", 0)
                
                if not hits:
                    logger.info("No more hits found in Algolia.")
                    break
                    
                logger.info(f"Processing {len(hits)} hits from page {page} (Total results available: {nb_hits})")
                for h in hits:
                    doc = _parse_teamford_vehicle(h)
                    if doc["vin"] or doc["stock_number"]:
                        all_vehicles.append(doc)
                
                if len(all_vehicles) >= nb_hits or page >= 25: 
                    break
                page += 1
                await asyncio.sleep(0.5) # Gentle rate limiting
                
        logger.info(f"Successfully scraped {len(all_vehicles)} vehicles from Team Ford.")
        return all_vehicles
    except Exception as e:
        logger.error(f"Sync Engine Failure: {str(e)}", exc_info=True)
        return []

async def sync_teamford_listings() -> Dict[str, int]:
    """Sync all Team Ford listings to local database."""
    logger.info("Initiating database sync...")
    try:
        vehicles = await scrape_teamford_inventory(limit=2000)
        if not vehicles:
            logger.warning("No vehicles scraped. Sync aborted.")
            return {"imported": 0, "updated": 0, "deleted": 0}
            
        imported = 0
        updated = 0
        
        from server import db
        
        for v in vehicles:
            vin = v.get("vin")
            stock = v.get("stock_number")
            if not vin and not stock: continue
            
            existing = None
            if vin: existing = await db.vehicles.find_one({"vin": vin})
            if not existing and stock: existing = await db.vehicles.find_one({"stock_number": stock})
            
            if existing:
                # Update existing
                await db.vehicles.update_one(
                    {"_id": existing["_id"]},
                    {"$set": {**v, "updated_at": datetime.now(timezone.utc)}}
                )
                updated += 1
            else:
                # Insert new
                v["created_at"] = datetime.now(timezone.utc)
                v["updated_at"] = v["created_at"]
                await db.vehicles.insert_one(v)
                imported += 1
        
        logger.info(f"Sync complete: {imported} imported, {updated} updated.")
        return {"success": True, "imported": imported, "updated": updated, "deleted": 0}
    except Exception as e:
        logger.error(f"Sync failed: {str(e)}", exc_info=True)
        return {"success": False, "imported": 0, "updated": 0, "deleted": 0}


async def scrape_teamford_inventory(limit: int = 2000) -> List[Dict[str, Any]]:
    """
    DEFINITIVE SYNC ENGINE: 
    - Captures NEW, USED, FEATURED, and ON SPECIAL vehicles.
    - Uses exact live facet filter structure.
    """
    try:
        headers = {
            "x-algolia-api-key": ALGOLIA_API_KEY,
            "x-algolia-application-id": ALGOLIA_APP_ID,
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Referer": "https://www.teamford.ca/"
        }

        all_vehicles = []
        page = 0
        hits_per_page = 100 

        async with httpx.AsyncClient(timeout=120.0) as client:
            while len(all_vehicles) < limit:
                payload = {
                    "requests": [
                        {
                            "indexName": "inventory",
                            "params": f"aroundRadius=500000&filters=craft_site_ids%3A34&hitsPerPage={hits_per_page}&page={page}"
                        }
                    ]
                }

                resp = await client.post(ALGOLIA_URL, json=payload, headers=headers)
                resp.raise_for_status()
                data = resp.json()

                result = data.get("results", [{}])[0]
                hits = result.get("hits", [])
                nb_hits = result.get("nbHits", 0)

                if not hits:
                    break

                for h in hits:
                    vehicle_doc = _parse_teamford_vehicle(h)
                    # We need to map objectID for source_url properly since list inventory returns objectID not slug
                    if h.get('objectID'):
                        vehicle_doc["source_url"] = f"https://www.teamford.ca/vehicles/{h.get('objectID')}"
                    all_vehicles.append(vehicle_doc)

                if len(all_vehicles) >= nb_hits or page >= 25: 
                    break

                page += 1
                await asyncio.sleep(0.3)

        return all_vehicles

    except Exception as e:
        logger.error(f"Sync Engine Failure: {str(e)}")
        return []


async def scrape_teamford_listing(url: str) -> Optional[Dict[str, Any]]:
    """
    Scrapes a single Team Ford vehicle listing page or uses Algolia API to fetch by URL.
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://www.teamford.ca/"
        }
        slug = url.rstrip('/').split('/')[-1]

        algolia_headers = {
            "x-algolia-api-key": ALGOLIA_API_KEY,
            "x-algolia-application-id": ALGOLIA_APP_ID,
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            payload = {
                "requests": [{
                    "indexName": "inventory",
                    "params": f"query={slug}&hitsPerPage=1&filters=craft_site_ids%3A34"
                }]
            }
            resp = await client.post(ALGOLIA_URL, json=payload, headers=algolia_headers)
            if resp.status_code == 200:
                data = resp.json()
                hits = data.get("results", [{}])[0].get("hits", [])
                if hits:
                    v_doc = _parse_teamford_vehicle(hits[0])
                    v_doc["source_url"] = url
                    return v_doc

            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            html = resp.text
            import re
            title_match = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE)
            title = title_match.group(1) if title_match else "Unknown Vehicle"

            return {
                "title": title, "make": "", "model": "", "year": 2024, "price": 0, "mileage": 0,
                "condition": "used", "body_type": "Sedan", "fuel_type": "Gas", "transmission": "Automatic",
                "drivetrain": "", "exterior_color": "", "interior_color": "", "engine": "",
                "vin": "", "stock_number": "", "description": f"Imported from Team Ford: {title}",
                "features": [], "images": [], "status": "available", "source": "teamford_url", "source_url": url
            }
    except Exception as e:
        logger.error(f"Failed to scrape listing {url}: {e}")
        return None

async def sync_teamford_listings() -> Dict[str, int]:
    """
    Sync all Team Ford listings to local database.
    Returns dict with 'imported' and 'updated' counts.
    """
    try:
        from server import db
        await db.settings.update_one(
            {"type": "scraper_status"}, 
            {"$set": {"status": "fetching_algolia", "progress": "Fetching data from Algolia API...", "imported": 0, "updated": 0}}, 
            upsert=True
        )

        vehicles = await scrape_teamford_inventory(limit=2000)
        imported, updated = 0, 0
        total = len(vehicles)
        
        for i, v in enumerate(vehicles):
            vin, stock = v.get("vin"), v.get("stock_number")
            if not vin and not stock: continue
            existing = None
            if vin: existing = await db.vehicles.find_one({"vin": vin})
            if not existing and stock: existing = await db.vehicles.find_one({"stock_number": stock})
            if existing:
                from datetime import datetime, timezone
                await db.vehicles.update_one({"_id": existing["_id"]}, {"$set": {**v, "updated_at": datetime.now(timezone.utc)}})
                updated += 1
            else:
                from datetime import datetime, timezone
                v["created_at"] = datetime.now(timezone.utc)
                await db.vehicles.insert_one(v)
                imported += 1
                
            if i % 20 == 0 or i == total - 1:
                await db.settings.update_one(
                    {"type": "scraper_status"}, 
                    {"$set": {"status": "syncing", "progress": f"Synced {i+1} of {total} vehicles...", "imported": imported, "updated": updated}}, 
                    upsert=True
                )

        await db.settings.update_one(
            {"type": "scraper_status"}, 
            {"$set": {"status": "idle", "progress": "Sync complete.", "imported": imported, "updated": updated}}, 
            upsert=True
        )

        return {"imported": imported, "updated": updated}
    except Exception as e:
        logger.error(f"Sync failed: {e}")
        from server import db
        await db.settings.update_one(
            {"type": "scraper_status"}, 
            {"$set": {"status": "error", "progress": f"Failed: {str(e)}"}}, 
            upsert=True
        )
        return {"imported": 0, "updated": 0}

