export type AiAction = 
  | 'improve' 
  | 'fix_spelling' 
  | 'make_longer' 
  | 'make_shorter' 
  | 'simplify' 
  | 'emojify' 
  | 'continue' 
  | 'summarize'
  | { type: 'tone'; tone: string }
  | { type: 'translate'; language: string }
  | { type: 'custom'; prompt: string };

export async function askAI(text: string, action: AiAction, context?: string): Promise<string> {
    // The AI provider key is held server-side. We call our own backend, which
    // proxies to the LLM — the key is never shipped in the browser bundle.
    const API_BASE = import.meta.env.VITE_API_BASE_URL;

    const systemPrompt = 'You are a helpful writing assistant. Respond ONLY with the converted or generated text, without any conversational filler, markdown code blocks (unless the user asked for code), or explanations.';
    let userPrompt = '';

    if (typeof action === 'string') {
        switch (action) {
            case 'improve':
                userPrompt = `Improve the writing of the following text:\n\n${text}`;
                break;
            case 'fix_spelling':
                userPrompt = `Fix any spelling and grammar mistakes in the following text. Do not change the meaning:\n\n${text}`;
                break;
            case 'make_longer':
                userPrompt = `Make the following text significantly longer and more detailed while keeping the original intent:\n\n${text}`;
                break;
            case 'make_shorter':
                userPrompt = `Make the following text much shorter and concise:\n\n${text}`;
                break;
            case 'simplify':
                userPrompt = `Simplify the language in the following text so it is easier to read and understand:\n\n${text}`;
                break;
            case 'emojify':
                userPrompt = `Add relevant emojis to the following text to make it more engaging. Do not change the original text, just add emojis:\n\n${text}`;
                break;
            case 'continue':
                userPrompt = `Continue writing the following text naturally. Provide the continuation only:\n\n${text}`;
                break;
            case 'summarize':
                userPrompt = `Summarize the following text:\n\n${text}`;
                break;
        }
    } else {
        if (action.type === 'tone') {
            userPrompt = `Rewrite the following text in a ${action.tone.toLowerCase()} tone:\n\n${text}`;
        } else if (action.type === 'translate') {
            userPrompt = `Translate the following text into ${action.language}:\n\n${text}`;
        } else if (action.type === 'custom') {
            userPrompt = `Here is some text: "${text}"\n\nPlease do the following: ${action.prompt}`;
            if (!text) {
                userPrompt = action.prompt;
                if (context) {
                    userPrompt = `Context:\n${context}\n\nPlease do the following: ${action.prompt}`;
                }
            }
        }
    }

    try {
        const response = await fetch(`${API_BASE}/ai/generate`, {
            method: 'POST',
            credentials: 'include', // send auth cookie
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                system: systemPrompt,
                prompt: userPrompt,
            })
        });

        if (!response.ok) {
            let message = 'Failed to fetch AI response';
            try {
                const error = await response.json();
                message = error.message || error.error?.message || message;
            } catch {
                // non-JSON error body
            }
            throw new Error(message);
        }

        const data = await response.json();
        return data.text || '';
    } catch (error: unknown) {
        console.error('AI Service Error:', error);
        throw new Error(error instanceof Error ? error.message : 'An unexpected error occurred while contacting the AI service.');
    }
}
