import { getDIDFromHandle, getProfile } from "./bsky-public.js";

async function getDIDFromHandleDB(env, handle) {
    try {
        const stmt = env.DB.prepare(
            "SELECT did FROM users WHERE handle = ?"
        ).bind(handle);
        
        const { results } = await stmt.all();
        
        if (!results || results.length === 0) {
            return { error: "No account found" };
        }

        if (results.length > 1) {
            return { error: "Multiple accounts cannot use the same handle" };
        }

        return { did: results[0].did };
    } catch (err) {
        return { error: err.message };
    }
}

async function registerUserDB(env, identifier, communityHandle) {
    // Check if user already has this community handle
    try {
        const stmt = env.DB.prepare(
            "SELECT did, community_handles FROM users WHERE community_handles LIKE ?"
        ).bind(`%${communityHandle}%`);
    
        const { results } = await stmt.all();
        if (results && results.length > 0) {
            for (const result of results) {
                const handles = result.community_handles.split(',');
                if (handles.includes(communityHandle)) {
                    if (result.did !== identifier) {
                        return { error: "Handle already taken" };
                    }
                    return { error: "Already initiated registration" };
                }
            }
        }
    } catch {
        return { error: err.message };
    }

    // Get DID from identifier
    const didResult = await getDIDFromHandle(identifier);
    if (didResult.error) {
        return { error: "User could not be found" };
    }

    // Get profile information
    const profile = await getProfile(identifier);
    if (profile.error) {
        return { error: "User could not be found" };
    }

    try {
        // Insert into database
        const { success } = await env.DB
            .prepare(
                "INSERT INTO users (did, at_handle, community_handles, registered, description, avatar, banner) VALUES (?, ?, ?, ?, ?, ?)"
            )
            .bind(
                didResult.did,
                profile.handle,
                communityHandle,
                false,
                profile.description || null,
                profile.avatar || null,
                profile.banner || null
            )
            .run();

        if (!success) {
            return { error: "Failed to register user" };
        }

        return { success: true };
    } catch (err) {
        return { error: err.message };
    }

    // TODO: Adding a Cloudflare TXT record
}