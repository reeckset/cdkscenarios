#!/usr/bin/env node
const cdk = require('@aws-cdk/core');
const { Exp1Stack } = require('../lib/exp1-stack');

const app = new cdk.App();
new Exp1Stack(app, 'Exp1Stack');
