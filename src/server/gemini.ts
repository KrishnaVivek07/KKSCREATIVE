import { GoogleGenAI } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

export interface ProjectContext {
  name: string;
  projectType: string;
  description: string;
  status?: string;
  components?: string[];
  tasks?: string[];
}

export async function generateProjectAssistance(
  prompt: string,
  projectContext?: ProjectContext,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; text: string }>
): Promise<string> {
  const ai = getGeminiClient();

  const systemInstruction = `You are the expert Senior Engineering, Electronics, Embedded Systems & Robotics Consultant for "KKS Creative Hub" workshop.
Your deep specializations include:
1. Electronics hardware design, PCB layout, schematics, component selection, datasheets, power regulation, sensor interfacing.
2. Embedded programming (ESP32, Arduino, STM32, Raspberry Pi Pico, RP2040, FreeRTOS, MQTT, BLE, I2C, SPI, UART).
3. Robotics kinematics, motor controllers, servo positioning, power distribution.
4. IoT telemetry, cloud dashboards, communication protocols, edge computing.
5. Project management, task estimation, workshop documentation, troubleshooting & bill-of-materials optimization.

Workshop Context:
${projectContext ? `
Current Project Name: ${projectContext.name}
Project Type: ${projectContext.projectType}
Description: ${projectContext.description}
Status: ${projectContext.status || 'Active'}
${projectContext.components && projectContext.components.length > 0 ? `Selected Components: ${projectContext.components.join(', ')}` : ''}
${projectContext.tasks && projectContext.tasks.length > 0 ? `Checklist Tasks: ${projectContext.tasks.join('; ')}` : ''}
` : 'General KKS Creative Hub Workshop Consultation'}

Guidelines:
- Provide clear, actionable engineering advice, pinout connections, wiring diagrams in text/markdown, code samples with comments, or diagnostic steps.
- Maintain professional, precise engineering terminology. Format formulas, pinouts, and code blocks cleanly.`;

  // Format contents
  const contents: string[] = [];
  if (conversationHistory && conversationHistory.length > 0) {
    for (const msg of conversationHistory.slice(-6)) {
      contents.push(`${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`);
    }
  }
  contents.push(`User: ${prompt}`);

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: contents.join('\n\n'),
    config: {
      systemInstruction,
      temperature: 0.7,
    },
  });

  return response.text || 'No response generated.';
}

export async function generateChecklistSuggestions(
  projectName: string,
  projectType: string,
  description: string
): Promise<Array<{ title: string; category: string; priority: 'low' | 'medium' | 'high'; description: string }>> {
  const ai = getGeminiClient();

  const prompt = `Generate a realistic 6 to 8 step engineering checklist for this workshop project:
Project Name: ${projectName}
Type: ${projectType}
Description: ${description}

Categories to distribute across: Requirements, Circuit design, CAD design, Component procurement, Firmware, Hardware assembly, Testing, Documentation.

Respond with a JSON array where each object has:
- "title": concise task title (string)
- "category": one of the categories above (string)
- "priority": "low" | "medium" | "high"
- "description": 1-2 sentence engineering description (string)`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  try {
    const rawText = response.text?.trim() || '[]';
    return JSON.parse(rawText);
  } catch (err) {
    console.error("Failed to parse checklist JSON:", err);
    return [];
  }
}

export async function explainComponentSpecs(componentName: string, category: string): Promise<string> {
  const ai = getGeminiClient();

  const prompt = `Provide a concise technical breakdown for the electronics component: "${componentName}" (Category: ${category}).
Include:
1. Key Technical Specifications (Voltage, current, operating ranges, interfaces).
2. Typical Wiring / Interface Connection (Pinout summary).
3. Common Design Caveats & Protection Tips (decoupling capacitors, pull-ups, thermal dissipation).
4. Best matched microcontroller or module pairs.
Keep it practical for a workshop engineer.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      systemInstruction: 'You are an electronics hardware engineer at KKS Creative Hub.',
      temperature: 0.5,
    },
  });

  return response.text || 'Component analysis unavailable.';
}

export interface SearchedComponentResult {
  name: string;
  category: string;
  manufacturer: string;
  modelNumber: string;
  description: string;
  specifications: string;
  pinoutSummary: string;
  operatingVoltage: string;
  packageType: string;
  referencePrice: number;
  currency: string;
  supplier: string;
  datasheetUrl: string;
  sourceUrl: string;
  notes: string;
  searchSources: Array<{ title: string; url: string }>;
}

export async function searchWebElectronicComponent(query: string): Promise<SearchedComponentResult> {
  const ai = getGeminiClient();

  const prompt = `You are an expert electronics procurement and component identification specialist for KKS Creative Hub.
Search for real technical details, manufacturer part numbers, datasheets, pinouts, and current market reference prices for this electronic component:
"${query}"

Perform a thorough search and return ONLY a single valid JSON object enclosed in \`\`\`json ... \`\`\` with exactly these keys:
{
  "name": "Standard official component name (e.g. INA219 High-Side DC Current Sensor Module)",
  "category": "Must be one of: Microcontrollers, Sensors, RFID, Motors, Motor drivers, Displays, Relays, Communication modules, Resistors, Capacitors, ICs, Connectors, Power supplies, PCBs, Wires, Mechanical parts, Other",
  "manufacturer": "Official manufacturer name (e.g. Texas Instruments / Espressif / Bosch Sensortec / STMicroelectronics / Allegro)",
  "modelNumber": "Exact model or MPN (e.g. INA219AIDCNR or ESP32-WROOM-32)",
  "description": "2-3 sentence technical description of function, protocol, and ideal embedded use cases.",
  "specifications": "Key specifications: operating voltage range, maximum current, communication protocols (I2C/SPI/UART), resolution, package type.",
  "pinoutSummary": "Readable pinout summary, e.g.: VCC (3-5V), GND, SCL, SDA, VIN+, VIN-",
  "operatingVoltage": "e.g. 3.0V to 5.5V",
  "packageType": "e.g. SOT-23-8 or Breakout Board Module or DIP-16",
  "referencePrice": 160,
  "currency": "₹",
  "supplier": "e.g. Robu.in / Mouser / DigiKey",
  "datasheetUrl": "Accurate manufacturer or standard datasheet link (e.g. https://www.ti.com/lit/ds/symlink/ina219.pdf or https://www.alldatasheet.com/view.jsp?Searchword=${encodeURIComponent(query)})",
  "sourceUrl": "https://www.google.com/search?q=${encodeURIComponent(query + ' electronic component datasheet')}",
  "notes": "Decoupling capacitor advice, pull-up recommendations, or thermal/wiring caution."
}`;

  let response;
  try {
    // Attempt with Google Search tool enabled for live web verification
    response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
      },
    });
  } catch (searchErr) {
    console.warn("Google Search tool invocation fallback:", searchErr);
    // Fallback to high-accuracy model knowledge
    response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
      },
    });
  }

  const rawText = response.text || '';
  const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || rawText.match(/\{[\s\S]*\}/);

  let parsed: any = {};
  if (jsonMatch) {
    try {
      parsed = JSON.parse(jsonMatch[1] ? jsonMatch[1].trim() : jsonMatch[0].trim());
    } catch (parseErr) {
      console.warn("JSON parse error on search result:", parseErr, rawText);
    }
  }

  // Extract any search grounding web sources
  const searchSources: Array<{ title: string; url: string }> = [];
  const groundingChunks = (response as any).candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (Array.isArray(groundingChunks)) {
    for (const chunk of groundingChunks) {
      if (chunk.web?.uri) {
        searchSources.push({
          title: chunk.web.title || chunk.web.uri,
          url: chunk.web.uri,
        });
      }
    }
  }

  return {
    name: parsed.name || `${query.toUpperCase()} Component`,
    category: parsed.category || 'Sensors',
    manufacturer: parsed.manufacturer || 'Standard Electronic OEM',
    modelNumber: parsed.modelNumber || query.toUpperCase(),
    description: parsed.description || `Integrated electronic component for embedded and workshop robotics projects (${query}).`,
    specifications: parsed.specifications || 'Operating voltage: 3.3V - 5.0V; Standard industrial temperature range.',
    pinoutSummary: parsed.pinoutSummary || 'VCC, GND, Signal / Bus pins',
    operatingVoltage: parsed.operatingVoltage || '3.3V / 5.0V',
    packageType: parsed.packageType || 'Breakout Module',
    referencePrice: Number(parsed.referencePrice) || 150,
    currency: parsed.currency || '₹',
    supplier: parsed.supplier || 'Robu.in / Mouser Electronics',
    datasheetUrl: parsed.datasheetUrl || `https://www.alldatasheet.com/view.jsp?Searchword=${encodeURIComponent(query)}`,
    sourceUrl: parsed.sourceUrl || `https://www.google.com/search?q=${encodeURIComponent(query + ' component')}`,
    notes: parsed.notes || 'Verify pin connections and provide appropriate power supply decoupling.',
    searchSources,
  };
}

