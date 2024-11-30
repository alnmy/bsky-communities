const endpoint = "https://public.api.bsky.app/";

async function getDIDFromHandle(handle) {
    try {
        const queryUrl = `https://cloudflare-dns.com/dns-query?name=_atproto.${handle}&type=TXT`;
        const dnsResponse = await fetch(queryUrl, {
            headers: { Accept: "application/dns-json" },
        });
        const dnsData = await dnsResponse.json();
    
        if (dnsData.Answer && dnsData.Answer.length > 0) {
          for (const answer of dnsData.Answer) {
            let txtRecord = answer.data.replace(/^"|"$/g, "");
            if (txtRecord.startsWith("did=did:plc:")) {
              return { did: txtRecord.split("=")[1] };
            }
          }
        }
    } catch { };
    try {
        const wellKnownUrl = `https://${handle}/.well-known/atproto-did`;
        const response = await fetch(wellKnownUrl);
        
        if (response.status !== 200) {
            return { error: `HTTP ${response.status}` };
        }
        
        const didText = await response.text();
        if (didText.startsWith('did:plc:')) {
            return { did: didText.trim() };
        }
        
        return { error: 'Invalid DID' };
    } catch {
        return { error: 'Invalid DID' };
    }
};

async function getProfile(identifier) {
    try {
        const response = await fetch(`${endpoint}xrpc/app.bsky.actor.getProfile?actor=${identifier}`);
        
        if (response.status === 400) {
            const errorData = await response.json();
            return { error: errorData.message };
        }
        
        const data = await response.json();
        return {
            handle: data.handle,
            did: data.did,
            displayName: data.displayName,
            description: data.description,
            avatar: data.avatar,
            banner: data.banner,
        };
    } catch (error) {
        return { error: 'Failed to fetch profile' };
    }
}

async function getListMembers(did, rkey) {
    const uri = `at://${did}/app.bsky.graph.list/${rkey}`;
    const queryUrl = `${endpoint}xrpc/app.bsky.graph.getList?list=${uri}&limit=100`;
    try {
        let members = [];
        let cursor = null;
        
        do {
            const url = cursor ? `${queryUrl}&cursor=${cursor}` : queryUrl;
            const response = await fetch(url);

            if (response.status !== 200) {
                console.log(response)
                const errorData = await response.json();
                return { error: errorData.message };
            }
            const data = await response.json();
            members = members.concat(data.items.map(item => item.subject.did));
            cursor = data.cursor;
        } while (cursor);

        return { members };
    } catch (error) {
        return { error: error };
    }
}

export { getDIDFromHandle, getProfile, getListMembers };