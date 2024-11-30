import { describe, it, expect } from 'vitest';
import { getDIDFromHandle, getListMembers, getProfile } from '../src/bsky-public.js';

describe('Bluesky Communities worker', () => {
    it('correctly grabs the DID for a user handle', async () => {
        expect(await getDIDFromHandle('safety.bsky.app')).toStrictEqual({ did: "did:plc:eon2iu7v3x2ukgxkqaf7e5np"}); // TXT record only 
        expect(await getDIDFromHandle('desu.cx')).toStrictEqual({ did: "did:plc:jwj6kf4xowjc5taykzoadxll"}); // HTTP well-known only, as of now.
    });

    it('correctly grabs information about a user', async () => {
        expect(await getProfile('safety.bsky.app')).toMatchObject({
            displayName: "Bluesky Safety"
        })
    });

    it('correctly grabs members of a list', async () => {
        const members = await (await getListMembers("did:plc:6lex766uif2o6hcu2cawgxsg", "3jvplg6i7vb2p")).members;
        expect(members).toContain("did:plc:fimur4e6uwynd7lxhzrpvq2f");
    });
});
