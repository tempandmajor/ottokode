"use strict";exports.id=707,exports.ids=[707],exports.modules={7707:(e,t,r)=>{r.d(t,{aiService:()=>a});class o{constructor(e){this.name="OpenAI",this.apiKey=e}get isAvailable(){return!!this.apiKey&&!this.apiKey.includes("PLACEHOLDER")}async generateResponse(e){if(!this.isAvailable)throw Error("OpenAI API key not configured");try{let t=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{Authorization:`Bearer ${this.apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-4",messages:e,max_tokens:1e3,temperature:.7})});if(!t.ok)throw Error(`OpenAI API error: ${t.statusText}`);let r=await t.json(),o=r.choices[0]?.message?.content||"No response generated";return{content:o,provider:"OpenAI",codeSnippet:this.extractCodeSnippet(o)}}catch(e){throw console.error("OpenAI API error:",e),e}}extractCodeSnippet(e){let t=e.match(/```[\w]*\n([\s\S]*?)\n```/);return t?t[1]:void 0}}class s{constructor(e){this.name="Anthropic",this.apiKey=e}get isAvailable(){return!!this.apiKey&&!this.apiKey.includes("PLACEHOLDER")}async generateResponse(e){if(!this.isAvailable)throw Error("Anthropic API key not configured");try{let t=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"x-api-key":this.apiKey,"Content-Type":"application/json","anthropic-version":"2023-06-01"},body:JSON.stringify({model:"claude-3-sonnet-20240229",max_tokens:1e3,messages:e.filter(e=>"system"!==e.role),system:e.find(e=>"system"===e.role)?.content})});if(!t.ok)throw Error(`Anthropic API error: ${t.statusText}`);let r=await t.json(),o=r.content[0]?.text||"No response generated";return{content:o,provider:"Anthropic",codeSnippet:this.extractCodeSnippet(o)}}catch(e){throw console.error("Anthropic API error:",e),e}}extractCodeSnippet(e){let t=e.match(/```[\w]*\n([\s\S]*?)\n```/);return t?t[1]:void 0}}class i{async generateResponse(e){await new Promise(e=>setTimeout(e,1e3+2e3*Math.random()));let t=e[e.length-1]?.content?.toLowerCase()||"";if(t.includes("function")||t.includes("create"))return{content:"I can help you create a function! Here's a template with TypeScript types and error handling:",provider:"Mock",codeSnippet:`function processData(data: any[]): any[] {
  try {
    if (!Array.isArray(data)) {
      throw new Error('Input must be an array');
    }

    const result = data.map(item => {
      // Add your processing logic
      return item;
    });

    return result;
  } catch (error) {
    console.error('Error processing data:', error);
    throw error;
  }
}`};if(t.includes("react")||t.includes("component"))return{content:"Here's a modern React component with TypeScript:",provider:"Mock",codeSnippet:`interface MyComponentProps {
  title: string;
  description?: string;
  onAction?: () => void;
}

export function MyComponent({ title, description, onAction }: MyComponentProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onAction?.();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-card rounded-lg border">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && (
        <p className="text-muted-foreground mt-2">{description}</p>
      )}
      <Button onClick={handleClick} disabled={isLoading} className="mt-4">
        {isLoading ? 'Loading...' : 'Action'}
      </Button>
    </div>
  );
}`};let r=["I'd be happy to help with that! Can you provide more details about what you're trying to accomplish?","That's an interesting question! Here's what I would suggest based on best practices...","Great question! Let me break this down for you with some practical examples.","I can definitely help with that. Here's a clean and efficient approach:"];return{content:r[Math.floor(Math.random()*r.length)],provider:"Mock"}}constructor(){this.name="Mock",this.isAvailable=!0}}class n{constructor(){this.providers=[],this.fallbackProvider=new i,this.initializeProviders()}initializeProviders(){try{let e=function(){let e="your_supabase_url_here",t="your_supabase_anon_key_here",r=process.env.NEXT_PUBLIC_APP_NAME||"Ottokode",o=process.env.NEXT_PUBLIC_APP_VERSION||"1.0.0",s=process.env.NEXT_PUBLIC_APP_DOMAIN||"https://ottokode.com";if(!e)throw Error("NEXT_PUBLIC_SUPABASE_URL is required");if(!t)throw Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is required");let i={supabase:{url:e,anonKey:t},app:{name:r,version:o,domain:s}};return(i.supabase.url.includes("your-project")||i.supabase.url.includes("placeholder"))&&console.warn("⚠️ Supabase URL appears to be a placeholder"),(i.supabase.anonKey.includes("placeholder")||i.supabase.anonKey.length<10)&&console.warn("⚠️ Supabase anon key appears to be a placeholder"),{...i,ai:{openai:"your_openai_key_here".includes("PLACEHOLDER")?void 0:"your_openai_key_here",anthropic:"your_anthropic_key_here".includes("PLACEHOLDER")?void 0:"your_anthropic_key_here",google:process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY?.includes("PLACEHOLDER")?void 0:process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY,cohere:process.env.NEXT_PUBLIC_COHERE_API_KEY?.includes("PLACEHOLDER")?void 0:process.env.NEXT_PUBLIC_COHERE_API_KEY,mistral:process.env.NEXT_PUBLIC_MISTRAL_API_KEY?.includes("PLACEHOLDER")?void 0:process.env.NEXT_PUBLIC_MISTRAL_API_KEY},stripe:process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.includes("PLACEHOLDER")?void 0:{publishableKey:process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY},features:{debug:"true"===process.env.NEXT_PUBLIC_DEBUG_MODE,analytics:"true"===process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,enterprise:"true"===process.env.NEXT_PUBLIC_ENABLE_ENTERPRISE_FEATURES,collaboration:"true"===process.env.NEXT_PUBLIC_ENABLE_COLLABORATION,aiChat:"true"===process.env.NEXT_PUBLIC_ENABLE_AI_CHAT}}}();e.ai.openai&&this.providers.push(new o(e.ai.openai)),e.ai.anthropic&&this.providers.push(new s(e.ai.anthropic)),console.log("\uD83E\uDD16 AI Providers initialized:",{available:this.providers.filter(e=>e.isAvailable).map(e=>e.name),total:this.providers.length})}catch(e){console.warn("⚠️ Error initializing AI providers:",e)}}async generateResponse(e){let t=this.providers.filter(e=>e.isAvailable);if(0===t.length)return console.log("\uD83E\uDD16 No AI providers available, using mock responses"),this.fallbackProvider.generateResponse(e);for(let r of t)try{return await r.generateResponse(e)}catch(e){console.warn(`❌ ${r.name} failed:`,e);continue}return console.log("\uD83E\uDD16 All AI providers failed, using mock responses"),this.fallbackProvider.generateResponse(e)}getAvailableProviders(){return this.providers.filter(e=>e.isAvailable).map(e=>e.name)}hasRealProviders(){return this.providers.some(e=>e.isAvailable)}}let a=new n}};