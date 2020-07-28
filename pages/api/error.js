import {APIHandler} from '../../src/apiHelpers'
export default APIHandler(() => {
  throw new Error('this throws an error!')
})
