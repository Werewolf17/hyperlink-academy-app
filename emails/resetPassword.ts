import mailgun from 'mailgun-js'
export default async (email:string, url:string) => {
  const mg = new mailgun({apiKey: process.env.MAILGUN_KEY as string, domain: 'mail.hyperlink.academy'})
  await mg.messages().send({
    from: 'accounts@mail.hyperlink.academy',
    to: email,
    subject: "Reset your password for hyperlink.academy",
    text: `Follow this link to reset your password: ${url}`,
    html: `<a href=${url}>reset your password</a>`
  })
}
