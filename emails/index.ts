import * as postmark from 'postmark'
import cohortEnrollmentMetadata from './templates/cohort-enrollment/meta.json'
import verifiyEmailMetadata from './templates/welcome/meta.json'
import resetPasswordMetadata from './templates/password-reset/meta.json'
import inviteToCourseMetadata from './templates/invite-to-course/meta.json'
import enrollNotificationMetada from './templates/enroll-notfication/meta.json'
import watchingNotificationMetadata from './templates/watching-notification/meta.json'

var client = new postmark.ServerClient(process.env.POSTMARK_TOKEN || '');

export const sendResetPasswordEmail = sendEmail(resetPasswordMetadata)
export const sendVerificationEmail = sendEmail(verifiyEmailMetadata)
export const sendCohortEnrollmentEmail = sendEmail(cohortEnrollmentMetadata)
export const sendInviteToCourseEmail = sendEmail(inviteToCourseMetadata)
export const sendEnrollNotificationEmaill = sendEmail(enrollNotificationMetada)
export const sendWatchingNotificationEmail = sendEmail(watchingNotificationMetadata)

type EmailMetadata = {
  Alias: string,
  TestRenderModel: object
}
export function sendEmail<T extends EmailMetadata>(meta:T){
  return (email: string, vars: T["TestRenderModel"]) => client.sendEmailWithTemplate({
    From: 'Hyperlink accounts@hyperlink.academy',
    To: email,
    TemplateAlias: meta.Alias,
    TemplateModel: vars
  })
}
