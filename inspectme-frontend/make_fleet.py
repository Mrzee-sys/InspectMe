import re

def create_page(template_path, new_path, page_name, var_prefix, type_str, category_title, items, icon='<path stroke-linecap="round" stroke-linejoin="round" d="M3 13h2l2 3h10l2-3h2M3 13v6h18v-6M5 13l2-5h10l2 5" />'):
    with open(template_path, 'r') as f:
        content = f.read()

    # Replacements
    content = content.replace("EmxPage", page_name)
    content = content.replace("EMX_CODES", f"{var_prefix}_CODES")
    content = content.replace("EMX_ITEMS", f"{var_prefix}_ITEMS")
    content = content.replace("emx", var_prefix.lower())
    content = content.replace("EMX", var_prefix)
    
    content = content.replace("EMERGENCY_EXITS", type_str)
    content = content.replace("Emergency Exits", category_title)
    
    # Fix the icons back to IM standard blue text for fleet
    content = content.replace('text-red-600', 'text-blue-600')

    # Redo the arrays
    codes = f"""const {var_prefix}_CODES = [
  {{ value: '', label: 'Select code (no deviation if blank)' }},
  {{ value: '{var_prefix}1', label: '{var_prefix}1 - Deviation found' }},
  {{ value: '{var_prefix}2', label: '{var_prefix}2 - Needs maintenance' }},
  {{ value: '{var_prefix}3', label: '{var_prefix}3 - Critical failure' }},
  {{ value: '{var_prefix}4', label: '{var_prefix}4 - Other' }},
]"""

    items_arr = ",\n  ".join([f"{{ key: '{var_prefix.lower()}{i+1:02d}', label: '{item}' }}" for i, item in enumerate(items)])
    items_block = f"const {var_prefix}_ITEMS = [\n  {items_arr}\n]"

    metadata_arr = ",\n  ".join([f"{var_prefix.lower()}{i+1:02d}: {{ label: 'Item {i+1}', svg: '{icon}' }}" for i, item in enumerate(items)])
    metadata_block = f"const ITEM_METADATA = {{\n  {metadata_arr}\n}};"

    content = re.sub(r'const EMX_CODES = \[.*?\]', codes, content, flags=re.DOTALL)
    content = re.sub(r'const EMX_ITEMS = \[.*?\]', items_block, content, flags=re.DOTALL)
    content = re.sub(r'const ITEM_METADATA = \{.*?\};', metadata_block, content, flags=re.DOTALL)

    with open(new_path, 'w') as f:
        f.write(content)

earth_items = [
    "Are daily pre-trip inspection registers completed and signed by the appointed operator?",
    "Are buckets ground-engaging tools (teeth) and pins secure and free of excessive wear?",
    "Are all hydraulic hoses boom cylinders and connections completely free from leaks or damage?",
    "Is the Roll-Over (ROPS) and Falling Object Protective Structure (FOPS) structurally intact?",
    "Are track links pads or heavy-duty tires in safe operational condition?",
    "Are reverse alarms amber strobe lights and hooters fully operational?"
]
create_page('src/pages/EmxPage.jsx', 'src/pages/EarthmovingPage.jsx', 'EarthmovingPage', 'EM', 'EARTHMOVING_EQUIPMENT', 'Earthmoving (TLBs)', earth_items)

dump_items = [
    "Are daily pre-trip inspection registers completed and signed by the appointed operator?",
    "Is the load bin tipping mechanism and hydraulic lift functioning smoothly without leaks?",
    "Are primary service brakes retarders and emergency parking brakes fully functional?",
    "Are all blind-spot mirrors or rear-view camera systems intact and properly aligned?",
    "Are heavy-duty tires free from deep cuts sidewall damage and properly inflated?"
]
create_page('src/pages/EmxPage.jsx', 'src/pages/DumpTrucksPage.jsx', 'DumpTrucksPage', 'DT', 'DUMP_TRUCKS', 'Dump Trucks (ADTs)', dump_items)

crane_items = [
    "Is the daily register and the latest comprehensive load test certificate available in the cabin?",
    "Is the Load Moment Indicator (LMI) and overload warning system fully operational?",
    "Are wire ropes slings and lifting hooks (including safety latches) free of damage fraying or stretching?",
    "Are outriggers stabilizer pads and hydraulic jacks functioning without leaks?",
    "Are all anti-two-block limit switches tested and working correctly?"
]
create_page('src/pages/EmxPage.jsx', 'src/pages/MobileCranesPage.jsx', 'MobileCranesPage', 'MC', 'MOBILE_CRANES', 'Mobile Cranes', crane_items)

elev_items = [
    "Are daily pre-trip registers and the latest 6-monthly load test certificates available?",
    "Are all safety rails swing gates and harness anchor points securely fixed to the platform?",
    "Do the emergency ground-level descent controls and platform tilt-alarms function correctly?",
    "Are hydraulic lift cylinders scissor arms or booms free from leaks and structural cracks?",
    "Are outriggers or pothole protection systems deploying correctly?"
]
create_page('src/pages/EmxPage.jsx', 'src/pages/ElevatingPlatformsPage.jsx', 'ElevatingPlatformsPage', 'EP', 'ELEVATING_PLATFORMS', 'Elevating Platforms', elev_items)

