/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: 'bool-api',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      protect: ['production'].includes(input?.stage ?? ''),
      home: 'aws',
      providers: { aws: { region: 'eu-west-1' } },
    };
  },
  async run() {
    const hcaptchaSecret = new sst.Secret('HCaptchaSecret');

    const sharedEnv = {
      HCAPTCHA_SECRET: hcaptchaSecret.value,
      SES_FROM_EMAIL: process.env.SES_FROM_EMAIL ?? '',
      SES_NOTIFY_EMAIL: process.env.SES_NOTIFY_EMAIL ?? '',
      SES_CONTACT_LIST: process.env.SES_CONTACT_LIST ?? '',
    };

    const sharedPermissions = [
      {
        actions: ['ses:SendEmail', 'ses:CreateContact', 'ses:UpdateContact', 'ses:DeleteContact'],
        resources: ['*'],
      },
    ];

    const api = new sst.aws.ApiGatewayV2('Api', {
      cors: {
        allowOrigins: ['https://bool.pt'],
        allowMethods: ['POST', 'OPTIONS', 'DELETE'],
        allowHeaders: ['Content-Type'],
      },
    });

    api.route('POST /contact', {
      handler: 'src/handlers/contact.handler',
      runtime: 'nodejs22.x',
      environment: sharedEnv,
      permissions: sharedPermissions,
    });

    api.route('POST /newsletter', {
      handler: 'src/handlers/newsletter.handler',
      runtime: 'nodejs22.x',
      environment: sharedEnv,
      permissions: sharedPermissions,
    });

    api.route('POST /unsubscribe', {
      handler: 'src/handlers/unsubscribe.handler',
      runtime: 'nodejs22.x',
      environment: sharedEnv,
      permissions: sharedPermissions,
    });

    api.route('DELETE /data', {
      handler: 'src/handlers/delete-data.handler',
      runtime: 'nodejs22.x',
      environment: sharedEnv,
      permissions: sharedPermissions,
    });

    return { apiUrl: api.url };
  },
});
