import { ResultType, APIHandler, Request} from 'src/apiHelpers'
import { PrismaClient } from '@prisma/client'
import { getToken } from 'src/token'
let prisma = new PrismaClient()

export default APIHandler({GET: getDiscount, DELETE: deleteDiscount})
export type GetDiscountResult = ResultType<typeof getDiscount>
export type DeleteDiscountResult = ResultType<typeof deleteDiscount>

async function getDiscount(req:Request){
  let code = req.query.code as string
  if(!code) return {status: 400, result: "ERROR: no discount code given"} as const
  let discount = await prisma.course_discounts.findOne({
    where: {code},
    include: {
      courses: {
        select: {
          slug: true,
          id: true
        }}}
  })
  if(!discount || discount.deleted) return {status:404, result: "ERROR: no discount found"} as const
  return {status:200, result: discount} as const
}

async function deleteDiscount(req:Request){
  let code = req.query.code as string
  let user = getToken(req)
  if(!user) return {status:401, result:"ERROR: no user logged in"}
  if(!code) return {status: 400, result: "ERROR: no discount code given"} as const
  let discount = await prisma.course_discounts.findOne({where:{code}, select:{
    people_in_cohorts:{
      select: {
        discount_used: true
      }
    },
    courses:{
      select:{
      course_maintainers: {select:{maintainer: true}}
      }
    }
  }})
  if(!discount) return {status:404, result: "ERROR: no discount found"} as const
  if(!discount.courses.course_maintainers.find(m=>m.maintainer === user?.id)){
    return {status:401, result: "ERROR: user is not a maintainer of this course"}
  }
  if(discount.people_in_cohorts.length === 0) {
    await prisma.course_discounts.delete({where:{code}})
  }
  else {
    await prisma.course_discounts.update({where:{code}, data: {deleted: true}})
  }
  return {status: 200, result: code} as const
}
