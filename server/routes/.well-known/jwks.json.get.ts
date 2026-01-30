import {getJwks} from '../../utils/keys'

export default defineEventHandler(async () => {
    return await getJwks()
})
