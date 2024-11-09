import { env } from 'node:process';

const BASE_URL = 'https://api.cloudflare.com/client/v4';

const checkEnv = () => {
  if (!env.DOMAIN) {
    throw new Error('DOMAIN environment variable is not set');
  }
  if (!env.API_TOKEN) {
    throw new Error('API_TOKEN environment variable is not set');
  }
  if (!env.ZONE_ID) {
    throw new Error('ZONE_ID environment variable is not set');
  }
}

const getPublicIP = async () => {
  try {
    const response = await fetch('https://4.ipw.cn');
    if (response.ok) {
      return await response.text();
    } else {
      throw new Error('Failed to fetch public IP: http status ' + response.status);
    }
  } catch {
    throw new Error('Failed to fetch public IP: network error');
  }
}

/**
 * Fetch DNS record by domain name from Cloudflare API.
 * 
 * @param {string} domain - domain name to query.
 * @returns {Object} - Returns the DNS record object.
 *  @property {string} id - DNS record id, will be used to update the record.
 *  @property {string} zone_id - Zone id.
 *  @property {string} name - DNS record name.
 *  @property {string} type - DNS record type, example: A, CNAME, TXT, etc.
 *  @property {string} content - DNS record content, example: "117.127.138.155"
 *  @property {number} ttl - DNS record TTL, in seconds.
 *  @property {boolean} proxied - Whether the DNS record is proxied by Cloudflare.
 * @throws {Error} - 如果请求失败或API响应不成功，则抛出错误
 */
const getRecord = async (domain) => {
  try {
    const url = `${BASE_URL}/zones/${env.ZONE_ID}/dns_records?name=${domain}`;
    const response = await fetch(url, {
      headers: {
          'Authorization': `Bearer ${process.env.API_TOKEN}`,
      },
    });
    if (response.ok) {
      const json = await response.json();
      if (json.success) {
          return json.result[0];
      } else {
          throw new Error('Failed to fetch DNS record: ' + json.errors[0].message);
      }
    } else {
      throw new Error('Failed to fetch DNS record: http status ' + response.status);
    }
  } catch (e) {
    throw new Error('Failed to fetch DNS record: ' + e.message);
  }
}

const updateRecord = async (record, ip) => {
  try {
    const url = `${BASE_URL}/zones/${record.zone_id}/dns_records/${record.id}`;
    const body = JSON.stringify({
      type: 'A',
      name: record.name,
      content: ip,
      ttl: 60,
      proxied: false,
    });
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${env.API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: body,
    })
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        console.log(`DNS record for ${record.name} updated successfully`);
      } else {
        throw new Error('Failed to update DNS record: ' + result.errors[0].message);
      }
    } else {
      throw new Error('Failed to update DNS record: http status ' + response.status);
    }
  } catch (e) {
    throw new Error('Failed to update DNS record: ' + e.message);
  }
}

const main = async () => {
  try {
    const domain = env.DOMAIN;
    checkEnv();
    const publicIP = await getPublicIP();
    const existingRecord = await getRecord(domain);
    if (publicIP === existingRecord.content) {
      console.info(`${publicIP} is already set for ${domain}`);
      return;
    } else {
        console.info(`Updating DNS record for ${domain} to ${publicIP}`);
        await updateRecord(existingRecord, publicIP);
    }
  } catch (e) {
    console.error(e.message);
    return;
  }
}


main();


