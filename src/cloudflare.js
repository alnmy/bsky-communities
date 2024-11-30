class CloudflareAPI {
    constructor(env) {
        this.token = env.CF_API_TOKEN;
        this.allowedRegistrationDomains = process.env.ALLOWED_REGISTRATION_DOMAINS.split(',') || [];
        this.landingPageDomains = process.env.LANDING_PAGE_DOMAINS.split(',') || [];
        this.baseUrl = 'https://api.cloudflare.com/client/v4';
    }

    async getZones() {
        try {
            const response = await fetch(`${this.baseUrl}/zones?per_page=50`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status >= 400) {
                const errorData = await response.json();
                return { errors: errorData.errors };
            }

            if (response.status === 200) {
                const data = await response.json();
                const allowedDomains = this.allowedRegistrationDomains;
                const accounts = data.result
                    .filter(zone => allowedDomains.includes(zone.name))
                    .reduce((acc, zone) => {
                        acc[zone.name] = zone.id;
                        return acc;
                    }, {});

                return { accounts };
            }
        } catch (error) {
            return { errors: [{ message: error.message }] };
        }
    }

    async getTXTRecords(zone_id) {
        try {
            const response = await fetch(
                `${this.baseUrl}/zones/${zone_id}/dns_records?per_page=5000&type=TXT`, 
                {
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status >= 400) {
                const errorData = await response.json();
                return { errors: errorData.errors };
            }

            if (response.status === 200) {
                const data = await response.json();
                const records = data.result.reduce((acc, record) => {
                    acc[record.name] = record.content;
                    return acc;
                }, {});
                return { records };
            }
        } catch (error) {
            return { errors: [{ message: error.message }] };
        }
    }

    async createTXTRecord(zone_id, name, value) {
        try {
            const response = await fetch(
                `${this.baseUrl}/zones/${zone_id}/dns_records`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        comment: 'Added by Bluesky Communities worker',
                        name: name,
                        type: 'TXT',
                        content: value,
                        ttl: 1,
                        settings: {}
                    })
                }
            );

            if (response.status >= 400) {
                const errorData = await response.json();
                return { errors: errorData.errors };
            }

            const data = await response.json();
            return data;
        } catch (error) {
            return { errors: [{ message: error.message }] };
        }
    }
}

module.exports = CloudflareAPI;
