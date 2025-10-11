import { createServerClient } from "@supabase/ssr";

export function createServerClient({req, res}) {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { 
            cookies: {
                get(name) { return req.cookies[name]; },
                set(name, value, options) { res.setHeader('Set-Cookie', `${name}=${value}; Path=/; HttpOnly; SameSite=Lax${options?.maxAge ? `; Max-Age=${options.maxAge}` : ''}`); },
                remove(name) { res.setHeader('Set-Cookie', `${name}=; Path=/; Max-Age=0`); },
        },
    }
    );
}