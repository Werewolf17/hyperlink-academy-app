const Semester0 = new Date('Sept 30 2019')

const GetSemester = () => {
  const semester:Array<{number: number, startDate: string}> = []
  const weeksSince0 = Math.floor((Date.now() - Semester0.getTime()) / (7 * 24 * 60 * 60 * 1000))
  let currentSemester = Math.floor(weeksSince0 / 6)

  for(let i = 0; i<3; i++) {
    semester.push({
      number: currentSemester + i,
      startDate: getStartDate(currentSemester + i)
    })
  }

  return semester
}

const getStartDate = (num: number):string => {
  let date = new Date(Semester0.getTime() + (num * 6 *7 * 24 * 60 * 60 * 1000) )
  return date.toDateString()
}

export const Semesters =  GetSemester()
