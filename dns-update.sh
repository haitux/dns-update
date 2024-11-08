#!/bin/sh

# This script is used to update the DNS record for a domain name using the GoDaddy API.
# It is intended to be run as a cron job every 5 minutes.

# Set the API key and secret for the GoDaddy API.
# You can obtain these from the GoDaddy developer portal.
# https://developer.godaddy.com/

# Before running this script, you must ensure that you have a public IP address. 
# To check if your current IP address is a public IP：
#   1. Log into your router and check the external IP address displayed by the router. 
#   2. Visit https://www.ip138.com to check your IP address.
# If both IP addresses are the same, it means you have a public IP; otherwise, it is a private IP.

API_KEY=""
API_SECRET=""
DOMAIN="haitu.io"
RECORD_NAME="nas"
PROXY="http://172.0.0.1:1080"

function command_exists() {
	command -v "$@" >/dev/null 2>&1
}

command_exists curl || {
	error "curl is not installed."
	exit 1
}

# Get the public IP address of your LAN from `4.ipw.cn`
PUBLIC_IP=`curl -s https://4.ipw.cn`
if [ -z $PUBLIC_IP ]; then
	echo "Failed to obtain the public IP."
	exit 1
fi

# Get the current DNS records for the domain
RESOLVED_IP=`ping "$RECORD_NAME.$DOMAIN" -c 1 | sed 's/.*(//;s/).*//;2,$d'`
if [ -z $RESOLVED_IP ]; then
	echo "Failed to get resolved IP."
	exit 1
fi

# Sends a request to the GoDaddy API to update the DNS record for the domain.
function godaddy_update() {
	local endpoint="https://api.godaddy.com/v1/domains/$DOMAIN/records/A/$RECORD_NAME"
	local data=`curl -s \
	                 --proxy $PROXY \
	                 -X PUT \
	                 -H "Authorization: sso-key $API_KEY:$API_SECRET" \
	                 -H "Content-Type: application/json" \
	                 -d "{\"data\":\"$PUBLIC_IP\",\"ttl\":600}" \
	                 "$endpoint"`

	echo $data; 
}

function cloudflare_update() {
	local endpoint="https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/dns_records/YOUR_RECORD_ID"
	local data=`curl -s \
	                 -X PUT \
	                 -H "Authorization: Bearer $API_KEY" \
	                 -H "Content-Type: application/json" \
	                 -d "{\"content\":\"$PUBLIC_IP\",\"ttl\":600}" \
	                 "$endpoint"`

	echo $data; 
}

if [ "$RESOLVED_IP" == "$PUBLIC_IP" ]; then
	echo "DNS record for $RECORD_NAME.$DOMAIN is already up-to-date."
	exit 0
fi

echo "Updating DNS record for $RECORD_NAME.$DOMAIN to $PUBLIC_IP ..."
cloudflare_update
