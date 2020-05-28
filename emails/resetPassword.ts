import * as postmark from 'postmark'
export default async (email:string, url:string) => {
  var client = new postmark.ServerClient(process.env.POSTMARK_TOKEN || '');
  await client.sendEmailWithTemplate({
    From: 'accounts@hyperlink.academy',
    To: email,
    TemplateAlias: "password-reset",
    TemplateModel: {
      action_url: url
    }
  })
}
