# dns-update

A script to update the DNS record for specified domain.

This script is used to update the DNS record for a domain name using the GoDaddy API.
It is intended to be run as a cron job every 5 minutes.

## 1. Ensure you have a public IP

Before running this script, you must ensure that you have a public IP address.
To check if your current IP address is a public IP：
  1. Log into your router and check the external IP address displayed by the router.
  2. Visit https://www.ip138.com to check your IP address.
If both IP addresses are the same, it means you have a public IP; otherwise, it is a private IP.


