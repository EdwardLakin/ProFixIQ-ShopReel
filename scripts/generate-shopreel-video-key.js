#!/usr/bin/env node
const crypto = require('crypto');

const key = crypto.randomBytes(32).toString('hex');
console.log(key);
console.log('Set this value as SHOPREEL_RAILWAY_VIDEO_API_KEY in both ShopReel and Railway video service environments.');
