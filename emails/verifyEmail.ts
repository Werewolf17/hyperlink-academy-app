import * as postmark from 'postmark'

export default async (email:string, action_url:string, name: string) => {
  var client = new postmark.ServerClient(process.env.POSTMARK_TOKEN || '');
  await client.sendEmailWithTemplate({
    From: 'accounts@hyperlink.academy',
    To: email,
    TemplateAlias: "welcome",
    TemplateModel: {
      action_url,
      name,
    }
  })
}
