// Vercel Serverless Function to generate store name suggestions via OpenAI
// This keeps the API key secure on the server side

export const config = {
    runtime: 'edge',
};

export default async function handler(request) {
    // Only allow POST requests
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
        return new Response(
            JSON.stringify({ error: 'OpenAI API key not configured' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }

    try {
        const body = await request.json();
        const { productType, experience } = body;

        // Build a context-aware prompt
        let contextHint = '';
        if (productType && productType !== 'Yes') {
            contextHint = `The merchant is ${productType.toLowerCase()}.`;
        }

        const prompt = `Generate 5 creative, memorable, and catchy store names for an online e-commerce store. 
${contextHint}
The names should be:
- Modern and trendy
- Easy to remember and spell
- Professional yet approachable
- Suitable for South African market context
- Unique and brandable

Return ONLY a JSON array of 5 store name strings, no explanations or additional text.
Example format: ["Store Name 1", "Store Name 2", "Store Name 3", "Store Name 4", "Store Name 5"]`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-5-nano',
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are a creative branding expert specializing in e-commerce store names. You respond only with valid JSON arrays.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.9,
                max_tokens: 200,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('OpenAI API error:', errorData);
            return new Response(
                JSON.stringify({ error: 'Failed to generate names' }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        // Parse the JSON array from the response
        let names;
        try {
            names = JSON.parse(content);
            if (!Array.isArray(names)) {
                throw new Error('Response is not an array');
            }
        } catch (parseError) {
            console.error('Failed to parse names:', content);
            // Fallback: try to extract names if the format is slightly off
            const match = content.match(/\[[\s\S]*\]/);
            if (match) {
                names = JSON.parse(match[0]);
            } else {
                return new Response(
                    JSON.stringify({ error: 'Failed to parse generated names' }),
                    {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' },
                    }
                );
            }
        }

        return new Response(JSON.stringify({ names }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error generating names:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}
