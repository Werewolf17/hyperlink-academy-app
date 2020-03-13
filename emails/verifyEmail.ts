import mailgun from 'mailgun-js'
export default async (email:string, url:string) => {
  const mg = new mailgun({apiKey: process.env.MAILGUN_KEY as string, domain: 'mail.hyperlink.academy'})
  await mg.messages().send({
    from: 'accounts@mail.hyperlink.academy',
    to: email,
    subject: "Confirm your hyperlink.academy account",
    text: `Follow this link to verify your email on hyperlink.academy: ${url}`,
    html: `<a href=${url}>verify your email</a>`
  })
}
